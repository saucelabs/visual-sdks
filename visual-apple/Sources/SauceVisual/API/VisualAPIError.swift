import Foundation

/// A failure reported by, or while reaching, the Sauce Visual API.
///
/// `code` is the stable `VisualError`. `detail` is a short description written by the SDK. It never
/// contains credentials or text from the server, since it ends up in NSError messages and logs.
public struct VisualAPIError: Error, Hashable, Sendable, CustomNSError, LocalizedError, CustomStringConvertible {
    public let code: VisualError
    public let detail: String?
    /// HTTP status, when the server answered.
    public let statusCode: Int?
    /// False only when the request certainly changed nothing on the server: it was never sent, or the
    /// server refused it. A timeout, a lost connection, or a server error leave the outcome unknown.
    internal let mayHaveBeenApplied: Bool

    public init(code: VisualError, detail: String? = nil, statusCode: Int? = nil) {
        self.init(code: code, detail: detail, statusCode: statusCode, mayHaveBeenApplied: true)
    }

    internal init(code: VisualError, detail: String? = nil, statusCode: Int? = nil, mayHaveBeenApplied: Bool) {
        self.code = code
        self.detail = detail
        self.statusCode = statusCode
        self.mayHaveBeenApplied = mayHaveBeenApplied
    }

    /// Errors compare by what callers see; `mayHaveBeenApplied` is only for the SDK's recovery.
    public static func == (lhs: VisualAPIError, rhs: VisualAPIError) -> Bool {
        lhs.code == rhs.code && lhs.detail == rhs.detail && lhs.statusCode == rhs.statusCode
    }

    public func hash(into hasher: inout Hasher) {
        hasher.combine(code)
        hasher.combine(detail)
        hasher.combine(statusCode)
    }

    public static var errorDomain: String { VisualError.errorDomain }
    public var errorCode: Int { code.rawValue }

    public var errorDescription: String? {
        let base = code.errorDescription ?? "Visual SDK error."
        guard let detail, !detail.isEmpty else { return base }
        let sentence = [".", "!", "?"].contains(where: detail.hasSuffix) ? detail : detail + "."
        return "\(base) \(sentence)"
    }

    public var description: String { errorDescription ?? "Visual SDK error." }

    public var errorUserInfo: [String: Any] {
        [NSLocalizedDescriptionKey: errorDescription ?? "Visual SDK error."]
    }
}
