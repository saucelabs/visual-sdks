# SauceVisual for Apple platforms

`SauceVisual` Swift and Objective-C SDK for XCUITest on iOS/iPadOS 15+, tvOS 15+, and macOS 14+.

The SDK creates, reuses, and finishes Sauce Visual builds from your UI tests, and uploads full-screen screenshots for comparison. Ignore regions, element clipping, and other check options are not yet implemented.

Development and binary distribution use **Xcode 26.6 / Swift 6.3**. The package uses Swift 5 language mode and is also tested in Swift 6 language mode.

## Installation

Add SauceVisual to your **UI test target only**, never to the app. XCUITest runs your tests in a separate runner process that drives the app from outside, so the app under test doesn't need the SDK. The SDK links XCTest, so an app that embeds it would not launch outside a test run.

### Swift Package Manager

Add this checkout as a local package in Xcode, and add the `SauceVisual` product to the UI test target.
See the [source consumer project](Tests/Integration/Source.xcodeproj) for an example.

### XCFramework

Add `SauceVisual.xcframework` to the UI test target and choose **Embed & Sign**.
The archive includes dSYMs, the consuming test target signs the framework. See the [binary consumer project](Tests/Integration/Binary.xcodeproj) for an example.

On macOS, UI tests need a signed runner (ad-hoc signing, **Sign to Run Locally**, is enough), and macOS may ask once to let Xcode control the computer under **Privacy & Security → Accessibility**.

## Credentials and region

The SDK reads the same environment variables as the other Sauce Visual SDKs:

| Variable | Purpose |
|---|---|
| `SAUCE_USERNAME`, `SAUCE_ACCESS_KEY` | Sauce Labs credentials (required) |
| `SAUCE_REGION` | `us-west-1` (default), `us-east-4`, `eu-central-1`, or `staging` |
| `SAUCE_VISUAL_BUILD_NAME`, `SAUCE_VISUAL_PROJECT`, `SAUCE_VISUAL_BRANCH`, `SAUCE_VISUAL_DEFAULT_BRANCH` | Build attributes |
| `SAUCE_VISUAL_CUSTOM_ID`, `SAUCE_VISUAL_BUILD_ID` | Reuse a running build |

Values passed in code take precedence. Tests on a simulator or device don't inherit your shell, so pass each variable with the `TEST_RUNNER_` prefix, which `xcodebuild` strips:

```bash
TEST_RUNNER_SAUCE_USERNAME="$SAUCE_USERNAME" TEST_RUNNER_SAUCE_ACCESS_KEY="$SAUCE_ACCESS_KEY" \
  xcodebuild test -scheme MyAppUITests -destination 'platform=iOS Simulator,name=iPhone 17'
```

In Xcode, set them under **Edit Scheme → Test → Arguments → Environment Variables**. Keep real keys out of shared (committed) schemes.

## Swift

```swift
import SauceVisual

let visual = try VisualClient(options: VisualBuildOptions(
    name: "Checkout", project: "iOS app", branch: "feature-checkout", defaultBranch: "main"
))

// In a UI test, after driving the app to the screen you want to compare:
try await visual.sauceVisualCheck("Checkout page")
```

`sauceVisualCheck(_:options:)` screenshots the whole screen and adds it to the shared build, creating the build if needed. The snapshot records the running test's class as its suite name and the test method as its test name, so the dashboard groups snapshots by test. It runs on the main actor, like the XCUI APIs.

Pass `VisualCheckOptions` to change how a snapshot is compared. Every field is optional:

```swift
try await visual.sauceVisualCheck("Products page", options: VisualCheckOptions(
    clipElement: app.otherElements["cart"],                            // snapshot only this element
    ignoreRegions: [CGRect(x: 0, y: 0, width: 402, height: 62)],        // points, like XCUIElement.frame
    ignoreElements: [app.staticTexts["timestamp"]],                     // must exist at the check
    regions: [.detectChanges(in: app.images["logo"], [.visual])],       // compare this area with its own rules
    diffingMethod: .balanced,                                           // the default
    diffingMethodSensitivity: .high,
    diffingMethodTolerance: DiffingMethodTolerance(minChangeSize: 3)
))
```

| Option | Purpose |
|---|---|
| `testName`, `suiteName` | Override the names taken from the running test |
| `clipElement` | Snapshot only this element. Parts off screen are cut off, and an element entirely off screen throws `VisualError.clipElementOffScreen`. Ignore regions still use screen coordinates |
| `ignoreRegions`, `ignoreElements` | Areas and elements left out of the comparison. A missing element throws `VisualError.elementNotFound` |
| `regions` | `SelectiveRegion.ignoreChanges(in:)` or `.detectChanges(in:_:)` for a rectangle or element |
| `diffingMethod` | `.balanced` (default), `.simple`, or `.experimental` |
| `diffingOptions` | Kinds of change to report: `.visual`, `.position`, `.dimensions`, and `.content`, `.structure`, `.style`, which need an element tree the SDK doesn't upload yet |
| `diffingMethodSensitivity`, `diffingMethodTolerance` | How strictly `.balanced` compares pixels |
| `baselineOverride` | Compare against another snapshot's baseline, for example `BaselineOverride(device: "iPhone 17")` to check an iPad against the iPhone baseline. Fields left `nil` keep the snapshot's own value. Baselines also match on the test and suite names, so to compare with a snapshot from another test, override `testName` too. Set it for every check with `VisualClient(baselineOverride:)`; a check's own override replaces it |

Rectangles are in points and converted to screenshot pixels. Parts outside the screen are clipped. Snapshots are compared with the baseline that has the same name, device, and OS version. On tvOS, the operating system is reported as `UNKNOWN`, because the API has no tvOS value.

Every `VisualClient` in the process shares one build: the first check creates it, or reuses the one named by `buildId` or `customId`. To get the build before the first check, for example to log its link, call `try await visual.build()`. Each test process gets its own build, so running the same tests on several devices gives one build per device.

**You don't need to finish the build.** When the last test ends, the SDK finishes the build it created and prints its dashboard link. A build reused through `buildId` or `customId` is left open for whoever created it, for example a CI step. Call `finish()` only to finish earlier. Errors are `VisualError` or `VisualAPIError`, in the `com.saucelabs.visual.apple` domain.

To pass credentials in code instead: `VisualClient(credentials: VisualCredentials(username: "…", accessKey: "…"), region: .euCentral1)`.

## Objective-C

Use `@import SauceVisual;` with source SPM, or the compatibility header with the XCFramework:

```objc
#import <SauceVisual/SauceVisual-Swift.h>

NSError *error = nil;
SLVBuildOptions *options = [[SLVBuildOptions alloc] initWithName:@"Checkout" project:@"iOS app"
    branch:@"feature-checkout" defaultBranch:@"main" customId:nil buildId:nil];
SLVClient *visual = [[SLVClient alloc] initWithOptions:options error:&error];
if (visual == nil) {
    NSLog(@"Initialization failed: %@", error.localizedDescription);
    return;
}

SLVCheckOptions *checkOptions = [[SLVCheckOptions alloc] init];
checkOptions.ignoreElements = @[app.staticTexts[@"timestamp"]];
[visual sauceVisualCheckWithName:@"Checkout page" options:checkOptions completion:^(SLVSnapshot *snapshot, NSError *failure) {
    if (failure != nil) {
        NSLog(@"Check failed: %@", failure.localizedDescription);
    }
}];
```

`SLVCheckOptions` covers the test and suite names, `clipElement`, `ignoreRegions` (`NSValue` rectangles in points), `ignoreElements`, `diffingMethod`, and `baselineOverride` (`SLVBaselineOverride`). Completions run once on the main thread. Use `initWithUsername:accessKey:region:options:error:` to pass credentials in code, or `initWithUsername:accessKey:region:options:baselineOverride:error:` to also set a baseline override for every check. Errors use `SLVClient.errorDomain` and `SLVErrorCode`.

## Development

Run package tests and source integration tests:

```bash
xcrun swift test -Xswiftc -strict-concurrency=complete -Xswiftc -warnings-as-errors
# Release needs -enable-testing, because some tests use @testable import.
xcrun swift test -c release -Xswiftc -enable-testing
for family in iphone ipad tvos macos; do
  Scripts/test.sh source "$family"
done
```

Build and test the XCFramework with Xcode 26.6 selected:

```bash
Scripts/build-xcframework.sh
for family in iphone ipad tvos macos; do
  Scripts/test.sh binary "$family"
done
```

The tests include live tests that create real builds, so they need credentials and fail without them. Set them in your shell, or in CI from the existing secrets. `Scripts/test.sh` forwards every `SAUCE_*` variable to the simulator:

```bash
export SAUCE_USERNAME=… SAUCE_ACCESS_KEY=… SAUCE_REGION=us-west-1
```

Shared build settings and the binary version live in [Configuration/SDK.xcconfig](Configuration/SDK.xcconfig).

## License

[Apache-2.0](LICENSE).
