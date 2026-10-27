# SauceVisual for Apple platforms

`SauceVisual` Swift and Objective-C SDK skeleton for iOS/iPadOS 15+, tvOS 15+, and macOS 12+.

The current APIs record checkpoints in memory and return session summaries. Screenshot capture, visual comparisons, and Sauce Visual service integration are not yet implemented.

Development and binary distribution use **Xcode 26.6 / Swift 6.3**. The package uses Swift 5 language mode and is also tested in Swift 6 language mode.

## Installation

### Swift Package Manager

Add this checkout as a local package in Xcode and select the `SauceVisual` product.
See the [source consumer project](Tests/Integration/Source.xcodeproj) for an example.

### XCFramework

Add `SauceVisual.xcframework` to the host app and choose **Embed & Sign**.
The archive includes dSYMs, the consuming app signs the framework. See the [binary consumer project](Tests/Integration/Binary.xcodeproj) for an example.

Both distributions provide a dynamic library. Embed it once in the host app, hosted test bundles should link the same copy.

## Swift

```swift
import SauceVisual

let session = try VisualSession(sessionName: "Checkout", maximumCheckpoints: 100)
let receipt = try await session.recordCheckpoint(named: "Cart")
let summary = try await session.finish()
print(receipt.sequence)
print(summary.checkpointCount)
```

`VisualSession` is an actor. Calling `finish()` ends the session and prevents further checkpoints: repeated calls return the same summary. Validation and session-state errors throw `VisualError`.

## Objective-C

Use `@import SauceVisual;` with source SPM, or the compatibility header with the XCFramework:

```objc
#import <SauceVisual/SauceVisual-Swift.h>

NSError *error = nil;
SLVClient *client = [[SLVClient alloc] initWithSessionName:@"Checkout"
                                    maximumCheckpoints:100
                                                  error:&error];
if (client == nil) {
    NSLog(@"Initialization failed: %@", error.localizedDescription);
    return;
}

[client recordCheckpointWithName:@"Cart"
                      completion:^(SLVCheckpointReceipt *receipt, NSError *failure) {
    if (failure != nil) {
        NSLog(@"Checkpoint failed: %@", failure.localizedDescription);
        return;
    }
    NSLog(@"Checkpoint: %ld", (long)receipt.sequence);
}];
```

Completions run once on `MainActor`. Methods return an `SLVOperation` that can be retained for cooperative cancellation via `cancel`. Errors use `SLVClient.errorDomain` and `SLVErrorCode`.

## Development

Run package tests and source integration tests:

```bash
xcrun swift test -Xswiftc -strict-concurrency=complete -Xswiftc -warnings-as-errors
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

Shared build settings and the binary version live in [Configuration/SDK.xcconfig](Configuration/SDK.xcconfig).

## License

[Apache-2.0](LICENSE).
