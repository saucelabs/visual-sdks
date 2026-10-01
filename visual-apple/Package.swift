// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SauceVisual",
    platforms: [.iOS(.v15), .tvOS(.v15), .macOS(.v14)],
    products: [.library(name: "SauceVisual", type: .dynamic, targets: ["SauceVisual"])],
    targets: [
        .target(
            name: "SauceVisual",
            dependencies: ["SauceVisualLoader"],
            resources: [.copy("Resources/PrivacyInfo.xcprivacy")],
            swiftSettings: [.enableExperimentalFeature("StrictConcurrency")]
        ),
        // Picks up test names from the first test. C, because Swift can't run code at load time.
        .target(name: "SauceVisualLoader"),
        .testTarget(
            name: "SauceVisualTests",
            dependencies: ["SauceVisual"],
            swiftSettings: [.enableExperimentalFeature("StrictConcurrency")]
        )
    ],
    swiftLanguageVersions: [.v5]
)
