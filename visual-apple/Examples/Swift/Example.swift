import SauceVisual

/// Compiled and executed by the consumer integration tests on every platform.
func runSwiftExample() async throws -> SessionSummary {
    let session = try VisualSession(sessionName: "Checkout flow")
    _ = try await session.recordCheckpoint(named: "Cart")
    _ = try await session.recordCheckpoint(named: "Confirmation")
    return try await session.finish()
}
