# SauceVisual for Apple platforms

`SauceVisual` Swift and Objective-C SDK for iOS/iPadOS 15+, tvOS 15+, and macOS 12+.

The SDK creates, reuses, and finishes Sauce Visual builds. Screenshot capture and visual comparisons are not yet implemented.

Development and binary distribution use **Xcode 26.6 / Swift 6.3**. The package uses Swift 5 language mode and is also tested in Swift 6 language mode.

## Installation

### Swift Package Manager

Add this checkout as a local package in Xcode and select the `SauceVisual` product.
See the [source consumer project](Tests/Integration/Source.xcodeproj) for an example.

### XCFramework

Add `SauceVisual.xcframework` to the host app and choose **Embed & Sign**.
The archive includes dSYMs, the consuming app signs the framework. See the [binary consumer project](Tests/Integration/Binary.xcodeproj) for an example.

Both distributions provide a dynamic library. Embed it once in the host app, hosted test bundles should link the same copy.

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
// After the last test:
let finished = try await visual.finish()
```

Every `VisualClient` in the process shares one build: the first `build()` creates it, or reuses the one named by `buildId` or `customId`. Call `finish()` once, after the last test. Errors are `VisualError` or `VisualAPIError`, in the `com.saucelabs.visual.apple` domain.

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
