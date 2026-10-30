# SauceVisual for Apple platforms

`SauceVisual` Swift and Objective-C SDK for XCUITest on iOS/iPadOS 15+, tvOS 15+, and macOS 14+.

The SDK creates, reuses, and finishes Sauce Visual builds from your UI tests, and uploads screenshots for comparison: the whole screen, one element, or a full page stitched from a scrolled element. Checks can ignore regions or elements, capture the element tree, and override the baseline.

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
| `SAUCE_REGION` | `us-west-1` (default), `us-east-4`, `eu-central-1`, `asia-south-2`, or `staging` |
| `SAUCE_VISUAL_BUILD_NAME`, `SAUCE_VISUAL_PROJECT`, `SAUCE_VISUAL_BRANCH`, `SAUCE_VISUAL_DEFAULT_BRANCH` | Build attributes |
| `SAUCE_VISUAL_CUSTOM_ID`, `SAUCE_VISUAL_BUILD_ID` | Reuse a running build |
| `SAUCE_VISUAL_TAGS` | Comma-separated tags for a new build, for example `smoke,nightly` |

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
    name: "Checkout", project: "iOS app", branch: "feature-checkout", defaultBranch: "main", tags: ["smoke"]
))

// In a UI test, after driving the app to the screen you want to compare:
try await visual.sauceVisualCheck("Checkout page")
```

`tags` are added to the build when the SDK creates it. Tags passed in code replace `SAUCE_VISUAL_TAGS`, and an empty list means no tags. A build reused by `buildId` or `customId` keeps its own tags.

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
| `diffingMethod` | `.balanced` (default) or `.experimental` |
| `diffingOptions` | Kinds of change to report: `.visual`, `.position`, `.dimensions`, and, with `captureDom`, `.content`, `.structure`, `.style` |
| `diffingMethodSensitivity`, `diffingMethodTolerance` | How strictly `.balanced` compares pixels |
| `baselineOverride` | Compare against another snapshot's baseline, for example `BaselineOverride(operatingSystemVersion: "26.5")` to keep comparing against iOS 26.5 baselines after the simulator moves to a newer iOS. Each field has three states: leave it out to keep the snapshot's own value, set a value (`operatingSystemVersion: "26.5"`, `operatingSystem: .ios`), or use `.null` to match baselines that have no value for that field (`device: .null`). Baselines also match on the test and suite names, so to compare with a snapshot from another test, override `testName` too. Set it for every check with `VisualClient(baselineOverride:)`; a check's own override replaces it |
| `captureDom` | Also upload the element tree, so the dashboard shows which element changed. Off by default. See [Element tree](#element-tree-dom) |
| `fullPage` | Scroll an element and snapshot all of its content. See [Full-page screenshots](#full-page-screenshots) |

### Element tree (DOM)

Turn on `captureDom` to upload the screen's element tree with the snapshot. The dashboard then shows which element changed, and `diffingOptions` can compare text, structure, and style.

```swift
// The whole screen of your app
try await visual.sauceVisualCheck("Cart", options: VisualCheckOptions(captureDom: true))

// One section, reporting only text and layout changes
try await visual.sauceVisualCheck("Order summary", options: VisualCheckOptions(
    clipElement: app.otherElements["orderSummary"],
    diffingOptions: [.content, .position, .dimensions],
    captureDom: true
))
```

- The tree comes from the app under test, or from `clipElement` when set.
- In Safari or a web view, it holds the page's accessibility elements, not its HTML. Clip to the web view to capture it.
- If the tree can't be read, the snapshot is uploaded without it and a warning is printed.

### Full-page screenshots

Pass the scrollable element, such as a table, list, or web view, to snapshot all of its content instead of the visible part:

```swift
try await visual.sauceVisualCheck("Products", options: VisualCheckOptions(
    fullPage: FullPageScreenshot(scrollElement: app.collectionViews["products"])
))
```

- The SDK scrolls the element down, waits, and takes a screenshot, until the content stops moving or `scrollLimit` screenshots are taken (10 by default). The screenshots are stitched into one image of the element.
- After each scroll it waits `delayAfterScroll` seconds (0.5 by default), then until the element has stopped changing, so scroll indicators have faded and lazy-loaded content has appeared.
- Capture starts from the current scroll position. Scroll to the top first if needed.
- Ignore regions are relative to the element, as with `clipElement`. A `clipElement` that is a different element takes precedence, and the full page is skipped.
- With `captureDom`, the element tree is read before scrolling, so it covers the first screen.
- Bars that stay in place while the content scrolls, like the status bar, a pinned header, or Safari's toolbar, show once: at the top or bottom of the image.
- Capture stops early when screenshots can't be lined up, for example when the overlapping part is blank.
- Not available on tvOS, where the check throws `VisualError.fullPageNotSupported`.

Rectangles are in points and converted to screenshot pixels. Parts outside the screen are clipped. Snapshots are compared with the baseline that has the same name, device, and OS version. On tvOS, the operating system is reported as `UNKNOWN`, because the API has no tvOS value.

Every `VisualClient` in the process shares one build: the first check creates it, or reuses the one named by `buildId` or `customId`. A `buildId` must name an existing build, otherwise the check throws `VisualError.buildNotFound`; a `customId` with no running build creates one with that ID. Every client must use the same region, credentials, and build options, otherwise it throws `VisualError.conflictingConfiguration`. To get the build before the first check, for example to log its link, call `try await visual.build()`. Each test process gets its own build, so running the same tests on several devices gives one build per device.

**You don't need to finish the build.** When the last test ends, the SDK finishes the build it created and prints its dashboard link. A build named by `buildId` or `customId` is left open, even when this run created it, because other workers may still be adding snapshots to it. Finish it from the step that knows every worker is done, for example a CI step after all test jobs. Call `finish()` only to finish earlier. Errors are `VisualError` or `VisualAPIError`, in the `com.saucelabs.visual.apple` domain.

**Sharing a build between workers.** Give every worker the same `customId`, for example from the CI pipeline, and a `finishDelay`:

```swift
let visual = try VisualClient(options: VisualBuildOptions(customId: ciPipelineId, finishDelay: 120))
```

- The first worker creates the build with that `customId`, and the others reuse it. A finished build with that `customId` makes the check throw `VisualError.buildAlreadyCompleted`.
- Every worker finishes the build when its tests end. The service waits `finishDelay` seconds after the last one before finishing it, so set it longer than the gap between workers. The delay is rounded up to whole seconds.
- `finishDelay` needs a `customId`, from code or `SAUCE_VISUAL_CUSTOM_ID`, and can't be negative. Otherwise the client throws `VisualError.invalidFinishDelay`.

**Failed requests.** If a request to create or finish the build fails before the service sees it, for example when there is no connection, the next call simply tries again. When the outcome is unknown, for example after a timeout, the service may have applied it, so the SDK never repeats it blindly:

- Creating a build named by `customId`: the next call looks the build up by that ID.
- Creating any other build: every later call fails with the same error, so a second build is never created.
- Finishing: the next `finish()` checks the build first, and finishes it again only if it is still running.

Once finishing starts, no more snapshots are accepted, even if finishing fails.

To pass credentials in code instead: `VisualClient(credentials: VisualCredentials(username: "…", accessKey: "…"), region: .euCentral1)`.

## Objective-C

Use `@import SauceVisual;` with source SPM, or the compatibility header with the XCFramework:

```objc
#import <SauceVisual/SauceVisual-Swift.h>

NSError *error = nil;
SLVBuildOptions *options = [[SLVBuildOptions alloc] initWithName:@"Checkout" project:@"iOS app"
    branch:@"feature-checkout" defaultBranch:@"main" customId:nil buildId:nil];
// To share a build between workers: ...customId:pipelineId buildId:nil finishDelay:@120];
// To tag a new build: ...buildId:nil finishDelay:nil tags:@[@"smoke"]];
SLVClient *visual = [[SLVClient alloc] initWithOptions:options error:&error];
if (visual == nil) {
    NSLog(@"Initialization failed: %@", error.localizedDescription);
    return;
}

SLVCheckOptions *checkOptions = [[SLVCheckOptions alloc] init];
checkOptions.ignoreElements = @[app.staticTexts[@"timestamp"]];
checkOptions.captureDom = YES;
[visual sauceVisualCheckWithName:@"Checkout page" options:checkOptions completion:^(SLVSnapshot *snapshot, NSError *failure) {
    if (failure != nil) {
        NSLog(@"Check failed: %@", failure.localizedDescription);
    }
}];
```

`SLVCheckOptions` covers the test and suite names, `clipElement`, `ignoreRegions` (`NSValue` rectangles in points), `ignoreElements`, `diffingMethod`, `captureDom`, the full-page settings (`fullPageScrollElement`, `fullPageScrollLimit`, `fullPageDelayAfterScroll`), and `baselineOverride` (`SLVBaselineOverride`; `nil` properties are unset, and `matchNullFor:` sends a field as `null`). Completions run once on the main thread. Use `initWithUsername:accessKey:region:options:error:` to pass credentials in code, or `initWithUsername:accessKey:region:options:baselineOverride:error:` to also set a baseline override for every check. Errors use `SLVClient.errorDomain` and `SLVErrorCode`.

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
