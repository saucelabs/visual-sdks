import Foundation

/// A snapshot added to the build. Its comparison result appears in the Sauce Visual dashboard.
public struct VisualSnapshot: Hashable, Sendable {
    public let id: String
    public let name: String
    public let buildId: String
    public let testName: String?
    public let suiteName: String?

    public init(id: String, name: String, buildId: String, testName: String? = nil, suiteName: String? = nil) {
        self.id = id
        self.name = name
        self.buildId = buildId
        self.testName = testName
        self.suiteName = suiteName
    }
}
