import Foundation

/// A failure reported by, or while reaching, the Sauce Visual API.
///
/// `code` is the stable `VisualError`. `detail` carries the server or transport message and never
/// contains credentials.
public struct VisualAPIError: Error, Hashable, Sendable, CustomNSError, LocalizedError, CustomStringConvertible {
    public let code: VisualError
    public let detail: String?
    /// HTTP status, when the server answered.
    public let statusCode: Int?

    public init(code: VisualError, detail: String? = nil, statusCode: Int? = nil) {
        self.code = code
        self.detail = detail
        self.statusCode = statusCode
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
