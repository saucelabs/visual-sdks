import Foundation

/// Your Sauce Labs username and access key. The key is hidden when printed.
public struct VisualCredentials: Hashable, Sendable {
    public let username: String
    public let accessKey: String

    /// Neither may be empty. Surrounding whitespace is removed.
    /// - Throws: `VisualError.invalidCredentials`.
    public init(username: String, accessKey: String) throws {
        let username = username.trimmingCharacters(in: .whitespacesAndNewlines)
        let accessKey = accessKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !username.isEmpty, !accessKey.isEmpty else { throw VisualError.invalidCredentials }
        self.username = username
        self.accessKey = accessKey
    }

    /// Reads `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY`.
    /// - Throws: `VisualError.invalidCredentials`.
    public static func fromEnvironment(
        _ environment: [String: String] = ProcessInfo.processInfo.environment
    ) throws -> VisualCredentials {
        try VisualCredentials(
            username: environment["SAUCE_USERNAME"] ?? "",
            accessKey: environment["SAUCE_ACCESS_KEY"] ?? ""
        )
    }

    internal var authorizationHeader: String {
        "Basic " + Data("\(username):\(accessKey)".utf8).base64EncodedString()
    }
}

extension VisualCredentials: CustomStringConvertible, CustomDebugStringConvertible, CustomReflectable {
    public var description: String { "VisualCredentials(username: \(username), accessKey: <redacted>)" }
    public var debugDescription: String { description }
    public var customMirror: Mirror { Mirror(self, children: ["username": username, "accessKey": "<redacted>"]) }
}
