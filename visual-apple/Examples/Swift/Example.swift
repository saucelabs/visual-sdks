import SauceVisual

/// Takes one snapshot. Credentials come from `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY`,
/// and the SDK creates and finishes the build for you.
func runSwiftExample(
    _ options: VisualBuildOptions = VisualBuildOptions(
        name: "Checkout flow", project: "Example app", branch: "feature-checkout", defaultBranch: "main"
    )
) async throws -> VisualSnapshot {
    let visual = try VisualClient(options: options)
    let snapshot = try await visual.sauceVisualCheck("Home screen")
    print("Sauce Visual build: \(snapshot.buildId)")
    return snapshot
}
