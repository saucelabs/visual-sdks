import CryptoKit
import Foundation

/// PUTs files to the presigned storage URLs the API returns.
///
/// It owns its session, so nothing configured on the API session (extra headers, cookies, stored
/// credentials, cache) reaches the storage service. The URL already grants access, so no credentials
/// are sent, and redirects are refused so the file only goes to the URL the API gave.
internal struct PresignedUploader: Sendable {
    /// What is uploaded, which sets its content type and how errors name it.
    enum Kind: Sendable {
        case screenshot

        var contentType: String {
            switch self {
            case .screenshot: return "image/png"
            }
        }

        var name: String {
            switch self {
            case .screenshot: return "Screenshot"
            }
        }
    }

    /// The whole upload must finish within this, like the JS SDK's 10 second upload timeout, so a
    /// stalled upload fails the check instead of holding up `finish()`.
    static let timeout: TimeInterval = 10

    let session: URLSession

    static let shared = PresignedUploader(configuration: .ephemeral)

    /// Tests pass a configuration with stub protocol classes; the upload policy is applied on top.
    init(configuration: URLSessionConfiguration) {
        configuration.timeoutIntervalForRequest = Self.timeout
        configuration.timeoutIntervalForResource = Self.timeout
        configuration.httpCookieStorage = nil
        configuration.httpShouldSetCookies = false
        configuration.urlCredentialStorage = nil
        configuration.urlCache = nil
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        session = URLSession(configuration: configuration, delegate: RefuseRedirects(), delegateQueue: nil)
    }

    /// The MD5 catches corrupted uploads.
    /// - Throws: `VisualAPIError` for an invalid URL, a failed, redirected, or timed-out upload, or `CancellationError`.
    func upload(_ data: Data, as kind: Kind, to url: String?) async throws {
        let url = try Self.validated(url, kind: kind)
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue(kind.contentType, forHTTPHeaderField: "Content-Type")
        request.setValue(Data(Insecure.MD5.hash(data: data)).base64EncodedString(), forHTTPHeaderField: "Content-MD5")
        request.httpBody = data
        let status: Int
        do {
            (_, status) = try await GraphQLTransport.send(request, with: session)
        } catch let error as VisualAPIError where error.code == .networkFailure {
            throw VisualAPIError(code: .networkFailure, detail: "\(kind.name) upload failed. \(error.detail ?? "")")
        }
        guard (200..<300).contains(status) else {
            throw VisualAPIError(code: .apiError, detail: "\(kind.name) upload failed with HTTP \(status).", statusCode: status)
        }
    }

    /// An absolute HTTPS URL with a host and no user or password. Plain HTTP is allowed only for a
    /// loopback host, for a backend running on this machine.
    static func validated(_ string: String?, kind: Kind) throws -> URL {
        guard let string, let components = URLComponents(string: string), let url = components.url,
              let scheme = components.scheme?.lowercased(), let host = components.host, !host.isEmpty,
              components.user == nil, components.password == nil,
              scheme == "https" || (scheme == "http" && ["localhost", "127.0.0.1", "::1", "[::1]"].contains(host.lowercased()))
        else {
            throw VisualAPIError(code: .apiError, detail: "The API returned an invalid \(kind.name.lowercased()) upload URL.")
        }
        return url
    }
}

/// Refuses every redirect, so the task ends with the redirect response, which counts as a failure.
private final class RefuseRedirects: NSObject, URLSessionTaskDelegate, Sendable {
    func urlSession(
        _ session: URLSession, task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest,
        completionHandler: @escaping @Sendable (URLRequest?) -> Void
    ) {
        completionHandler(nil)
    }
}
