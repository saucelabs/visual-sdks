# SauceVisual for Apple platforms

`SauceVisual` Swift and Objective-C SDK for XCUITest on iOS/iPadOS 15+, tvOS 15+, and macOS 14+.

The SDK creates, reuses, and finishes Sauce Visual builds from your UI tests. Screenshot capture and visual comparisons are not yet implemented.

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
let build = try await visual.build()
print(build.url ?? build.id)
```

Every `VisualClient` in the process shares one build: the first `build()` creates it, or reuses the one named by `buildId` or `customId`. Each test process gets its own build, so running the same tests on several devices gives one build per device.

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

[visual buildWithCompletion:^(SLVBuild *build, NSError *failure) {
    if (failure != nil) {
        NSLog(@"Build failed: %@", failure.localizedDescription);
        return;
    }
    NSLog(@"Sauce Visual build: %@", build.url);
}];
```

Completions run once on the main thread. Use `initWithUsername:accessKey:region:options:error:` to pass credentials in code. Errors use `SLVClient.errorDomain` and `SLVErrorCode`.

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
