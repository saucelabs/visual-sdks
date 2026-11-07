import Foundation
import SauceVisual

/// Takes one snapshot. Credentials come from `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY`,
/// and the SDK creates and finishes the build for you.
@MainActor
func runSwiftExample(
    _ options: VisualBuildOptions = VisualBuildOptions(
        name: "Checkout flow", project: "Example app", branch: "feature-checkout", defaultBranch: "main"
    ),
    checkOptions: VisualCheckOptions = VisualCheckOptions(),
    session: URLSession? = nil
) async throws -> VisualSnapshot {
    let visual = try VisualClient(options: options, session: session)
    let snapshot = try await visual.sauceVisualCheck("Home screen", options: checkOptions)
    print("Sauce Visual build: \(snapshot.buildId)")
    return snapshot
}
