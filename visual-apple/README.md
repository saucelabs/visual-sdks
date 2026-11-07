# SauceVisual for Apple UI tests

`SauceVisual` submits screenshots from XCUITest on iOS/iPadOS 15+, tvOS 15+, and macOS 14+. The SDK runs in the UI-test runner, not the application under test. Development and CI use modern Xcode; the selected CI reference is Xcode 26.6. Swift 5 language mode and explicit Swift 6 checks are maintained. The manifest's tools declaration is not an old-compiler acceptance claim.

## Installation

The Swift package manifest is at the **repository root**. For local work, add the root `visual-sdks` checkout in Xcode, not `visual-apple/`. Repository-URL installation must select an approved revision/version that contains that root manifest. No release tag or downloadable release is implied by this source contribution.

Link `SauceVisual` to the **UI test target only**. It is a dynamic library: ensure the test bundle's Frameworks copy phase embeds it with **Code Sign On Copy**. The app under test must not link or embed it. Inspect the built runner: `MyAppUITests-Runner.app/PlugIns/MyAppUITests.xctest/Frameworks/SauceVisual.framework` should exist. Test with clean DerivedData and a physical device; simulator search paths can hide embedding mistakes.

Select an Xcode version that supports the intended test OS. The package's deployment targets do not override the minimum OS required by that Xcode's XCTest libraries; validate the oldest supported test runtime before release.

For direct binary integration, add `SauceVisual.xcframework` to the test target and embed/sign it there. Source and binary distributions must not both be linked into one runner. The archive includes matching dSYMs. The native integration projects demonstrate both paths.

Use a development-signed test configuration when debugger attachment is required. Do not replace an existing Ad Hoc/distribution configuration to install this SDK. Keep application distribution and development-test signing in separate schemes/configurations. The SDK never changes app provisioning profiles or `get-task-allow`.

## Credentials and run configuration

Credentials can be supplied as `VisualCredentials` or through `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY`. `SAUCE_REGION` selects the data center; supported names include `us-west-1`, `us-east-4`, `eu-central-1`, `asia-south-2`, and `staging`.

Build defaults use `SAUCE_VISUAL_BUILD_NAME`, `SAUCE_VISUAL_PROJECT`, `SAUCE_VISUAL_BRANCH`, `SAUCE_VISUAL_DEFAULT_BRANCH`, `SAUCE_VISUAL_BUILD_ID`, `SAUCE_VISUAL_CUSTOM_ID`, and comma-separated `SAUCE_VISUAL_TAGS`. Code values take precedence. Keep secrets out of committed schemes and logs. For command-line UI tests, pass them using the `TEST_RUNNER_` prefix, which the runner receives without the prefix.

```bash
TEST_RUNNER_SAUCE_USERNAME="$SAUCE_USERNAME" \
TEST_RUNNER_SAUCE_ACCESS_KEY="$SAUCE_ACCESS_KEY" \
xcodebuild test -scheme MyAppUITests \
  -destination 'platform=iOS Simulator,id=YOUR_SIMULATOR_UDID'
```

All clients in one process share a run. Matching endpoint, credentials, and resolved build options use the first owner's API transport. Conflicting configurations are rejected. A build UUID is normalized before comparison. A failed call does not silently rebind a closed run.

The default API session is ephemeral, with a 30-second request timeout and 60-second resource timeout. An explicitly injected API session has the caller's own policy. Storage uploads use a separate, credential-free session, refuse redirects, and have a 10-second resource timeout.

## Swift use

```swift
import XCTest
import SauceVisual

@MainActor
func submitCheckout(using app: XCUIApplication) async throws -> VisualSnapshot {
    let visual = try VisualClient(options: VisualBuildOptions(
        name: "Checkout", project: "iOS app", branch: "feature-checkout",
        defaultBranch: "main", tags: ["smoke"]
    ))
    return try await visual.sauceVisualCheck("Checkout")
}
```

Await each check. Success is a **submission receipt**, not a visual-equality assertion. Comparison results are evaluated in Sauce Visual or by the owning CI integration separately.

The receipt includes `id`, `buildId`, names, local `pixelWidth`/`pixelHeight`, `hasDom`, and `captureExtent`. Public captures have positive dimensions. `hasDom` confirms upload, not backend semantic interpretation. `captureExtent` is `.viewport`, `.noMovementDetected`, or an explicitly permitted `.limitReached` prefix.

Screenshot and XCUI access remain on MainActor. Checks are admitted before capture, so a closed or conflicting run cannot scroll the app before rejection. Capture sequences are serialized across clients, including suspension while scrolling settles. At most two public capture/submission pipelines retain SDK-owned images concurrently. Network waits do not monopolize the UI capture gate.

## Viewport checks, clipping, and regions

`clipElement` keeps the visible part of one element. Explicit rectangles use **screen points**, like `XCUIElement.frame`, and are projected into the uploaded image's pixels. Missing elements throw. Invalid geometry, unknown comparison bits, and out-of-range thresholds fail before capture or network side effects. A valid off-screen region may be omitted; ignore regions are comparison controls, not data redaction.

```swift
let receipt = try await visual.sauceVisualCheck("Cart", options: VisualCheckOptions(
    clipElement: app.otherElements["cart"],
    ignoreElements: [app.staticTexts["timestamp"]],
    diffingMethod: .balanced,
    diffingMethodTolerance: DiffingMethodTolerance(color: 0.1, minChangeSize: 3)
))
```

`diffingOptions` can select kinds of changes. `.content`, `.structure`, and `.style` require a successfully captured/uploaded tree, including when selected by a region. The same requirement applies to `.all`. `DiffingMethod` supports `.balanced` and `.experimental`.

## Element tree (DOM)

`captureDom: true` is a **required artifact request**: a foreground-app/tree-read failure, missing upload URL, or failed PUT fails the check instead of silently returning ordinary success. No snapshot registration is sent after a failed required tree upload. Allocation or screenshot upload may already have occurred before a later transport failure; this is not remote rollback.

The tree contains accessibility identifiers, labels, values, and descendants, potentially beyond visible image content. Use test data. Ignore masks do not redact it. Raw tree errors/content are not logged. The screenshot and tree are sequential observations, not an atomic observation of a changing app.

The existing consumer representation uses integer point bounds plus a device-pixel ratio. Bounds are therefore quantized; exact sub-point alignment is not promised. Fractional-point crop origins are rejected rather than silently shifting the tree. Full-screen trees and whole-point clip origins remain supported. A different representation requires producer/consumer contract validation before changing the wire format.

Capture is bounded by tree depth, node count, and a conservative encoded-size budget. Exceeding a budget throws; the tree is not silently truncated. In Safari/web views the hierarchy is accessibility content, not HTML.

Full-page images with DOM or masks are **not supported in this version**. The first viewport's tree/masks cannot be presented as metadata for stitched lower content.

## Bounded scroll capture

Scroll capture is available on iOS/iPadOS and macOS, not tvOS. It starts from the current position and leaves the app at the resulting position. It requires a stable, non-resizing viewport and enough unique image content to establish alignment. Repetitive/blank content may be rejected rather than guessed.

```swift
let receipt = try await visual.sauceVisualCheck("Products", options: VisualCheckOptions(
    fullPage: FullPageScreenshot(
        scrollElement: app.collectionViews["products"],
        scrollLimit: 10,
        allowPartialAtLimit: false,
        maximumOutputPixels: 20_000_000,
        maximumDuration: 60
    )
))
```

A gesture distance is not treated as a measured content offset. Zero movement participates in alignment, and ambiguous matches throw `captureAlignmentFailed`. A stability timeout throws. Reaching the screenshot cap throws `captureLimitReached` unless the caller explicitly sets `allowPartialAtLimit: true`; that receipt then reports `.limitReached`.

`.noMovementDetected` requires two consecutive scroll attempts with measured zero movement, so one missed gesture does not end capture. Confirmation attempts count toward `scrollLimit` and the capture deadline. This is not a guarantee that an indefinitely lazy-loaded application has no future content; no pixel-only algorithm can prove that general property.

Defaults permit 20 million output pixels and 60 seconds of capture. Hard client-side limits are 32 million output pixels, 64 MiB of retained input PNG data, 100 screenshots, and 300 seconds. These are safety policies, not server limits or a guarantee of available memory on every device. Rendering checks arithmetic before allocating the canvas and decodes/draws one frame at a time. Select lower limits for constrained runners and measure on supported devices.

Do not combine effective scroll capture with `captureDom`, ignore regions/elements, or selective regions. The SDK rejects these combinations until metadata projection is implemented. A different `clipElement` takes precedence over a full-page element, as before.

## Baseline overrides

The client may provide a default `BaselineOverride`. A per-check override **replaces**, not merges, that default. An empty per-check override clears inheritance.

Each field has three states: omitted keeps the snapshot's own value, `.value(x)` selects that value, and `.null` matches an absent field. String literals and OS shortcuts remain supported:

```swift
let override = BaselineOverride(device: .null, operatingSystemVersion: "26.5")
```

Baseline selection also depends on test/suite identity. Override those fields deliberately when comparing against another test's baseline.

## Lifecycle, cancellation, and recovery

Explicit `finish()` closes admission, waits for admitted captures and uploads, and then finalizes once. It does not automatically assert the comparison result. A cancelled waiter does not cancel shared creation or accepted run-owned finalization. Cancellation is cooperative and does not undo committed remote work. Native XCUI calls have their own behavior and cannot be interrupted by an arbitrary Swift deadline.

XCTest shutdown finalization is a **bounded best-effort fallback**. A warning/timeout there does not fail an already-finished test. For strict CI acceptance, use an owner that awaits/inspects finalization and evaluates the comparison result. Do not finish a process-shared build in every individual test's teardown.

Builds named by `buildId` or `customId` are left open for their owner unless delayed finalization is explicitly configured. `finishDelay` is a service grace period, not knowledge that all workers finished. An external owner after all workers is the deterministic shared-run pattern. A supplied build UUID must exist.

Unknown mutation outcomes do not authorize another creation. With a custom ID the SDK performs reconciliation lookups; without one it preserves the failure for that run. A finish retry looks up state and accepts only supported RUNNING/COMPLETED modes. Generic network/HTTP errors are conservative; the final error alone may not prove no request was sent. Safe pre-execution rejections may be retried. Closed admission is never reopened.

## Objective-C

Use `@import SauceVisual;` for source SPM, or `<SauceVisual/SauceVisual-Swift.h>` for the binary. The `SLVClient` facade uses the same coordinator. Completions are asynchronous on MainActor, exactly once, with a result or error. Keep the XCTest expectation alive until completion.

Operations return an optional-to-retain `SLVOperation` handle with `cancel`. Dropping it does not cancel work. `SLVSnapshot` exposes `captureExtent`, `hasDom`, and pixel dimensions. `SLVCheckOptions` adds `fullPageAllowPartialAtLimit`, `fullPageMaximumOutputPixels`, and `fullPageMaximumDuration`. Configuration builders remain single-owner mutable objects; do not mutate them during the call's synchronous value copy. Stable NSError codes are appended, never renumbered, in `com.saucelabs.visual.apple`.

## Development and acceptance

From the repository root:

```bash
export DEVELOPER_DIR=/Applications/Xcode_26.6.app/Contents/Developer
xcrun swift test -Xswiftc -strict-concurrency=complete -Xswiftc -warnings-as-errors
xcrun swift test -c release -Xswiftc -strict-concurrency=complete -Xswiftc -warnings-as-errors
xcrun swift test -Xswiftc -swift-version -Xswiftc 6 \
  -Xswiftc -strict-concurrency=complete -Xswiftc -warnings-as-errors
cd visual-apple
Scripts/check-xcodeproj-sources.sh
for family in iphone ipad tvos macos; do Scripts/test.sh source "$family"; done
Scripts/build-xcframework.sh
for family in iphone ipad tvos macos; do Scripts/test.sh binary "$family"; done
```

Live consumer tests need authorized fixture credentials and submit real artifacts. Scripts retain logs/results and fail on empty runs, failures, or skips; there are no hardcoded test totals. Remove or relocate generated `dist/` intentionally before rebuilding, because the build never overwrites it.

The live consumer fixture injects an API session with a 60-second request timeout and a 90-second resource timeout to accommodate service latency on hosted runners. It does not retry mutations. The runner retains its 120-second per-test limit, and the SDK's default session policy is unchanged.

New SDK Swift files must be in the package source directory and all native framework targets. The membership check follows target source phases. New package tests are automatically discovered; public consumer tests need both integration projects. Binary consumers must never compile SDK sources as a fallback.

Before release, validate a clean repository-URL consumer and signed physical iOS device, positive/negative Objective-C paths, maximum-size captures, DOM consumer interpretation, and the tested original XCFramework. CI artifacts expire and are not a durable customer release endpoint. No old-Xcode lane or provenance system is required by this contribution.
