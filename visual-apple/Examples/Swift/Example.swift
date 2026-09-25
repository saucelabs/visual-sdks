import SauceVisual

/// Compiled on every platform by the consumer integration tests, and run by the live test.
///
/// Credentials and region come from `SAUCE_USERNAME`, `SAUCE_ACCESS_KEY`, and `SAUCE_REGION`.
/// In CI, `branch` usually comes from `SAUCE_VISUAL_BRANCH` instead of code.
func runSwiftExample(
    _ options: VisualBuildOptions = VisualBuildOptions(
        name: "Checkout flow", project: "Example app", branch: "feature-checkout", defaultBranch: "main"
    )
) async throws -> VisualBuild {
    let visual = try VisualClient(options: options)
    let build = try await visual.build()
    print("Sauce Visual build: \(build.url ?? build.id)")
    // Call once, after the last test.
    return try await visual.finish()
}
