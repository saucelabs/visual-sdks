// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SauceVisual",
    platforms: [.iOS(.v15), .tvOS(.v15), .macOS(.v14)],
    products: [.library(name: "SauceVisual", type: .dynamic, targets: ["SauceVisual"])],
    targets: [
        .target(
            name: "SauceVisual",
            resources: [.copy("Resources/PrivacyInfo.xcprivacy")],
            swiftSettings: [.enableExperimentalFeature("StrictConcurrency")]
        ),
        .testTarget(
            name: "SauceVisualTests",
            dependencies: ["SauceVisual"],
            swiftSettings: [.enableExperimentalFeature("StrictConcurrency")]
        )
    ],
    swiftLanguageVersions: [.v5]
)
