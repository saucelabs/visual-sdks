import Foundation

/// SDK version sent in the `User-Agent` header. Keep in sync with `MARKETING_VERSION` in `Configuration/SDK.xcconfig`.
internal let sauceVisualVersion = "0.1.0"

/// Minimal GraphQL-over-HTTP client for the Sauce Visual API. Stateless and safe to share.
internal struct GraphQLTransport: Sendable {
    let endpoint: URL
    let credentials: VisualCredentials
    let session: URLSession

    init(endpoint: URL, credentials: VisualCredentials, session: URLSession = .shared) {
        self.endpoint = endpoint
        self.credentials = credentials
        self.session = session
    }

    /// Sends one operation whose root field is aliased as `result`.
    ///
    /// Returns `nil` only when the server answered with an explicit `"result": null` and no errors, so a
    /// lookup miss can't be confused with a failed or malformed response.
    /// - Throws: `VisualAPIError` for transport and HTTP failures, any GraphQL error (even next to a
    ///   partial result), a response without a `result` field, or `CancellationError`.
    func execute<Variables: Encodable & Sendable, Result: Decodable & Sendable>(
        _ query: String,
        variables: Variables,
        as _: Result.Type
    ) async throws -> Result? {
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(credentials.authorizationHeader, forHTTPHeaderField: "Authorization")
        request.setValue("sauce-visual-apple/\(sauceVisualVersion)", forHTTPHeaderField: "User-Agent")
        do {
            request.httpBody = try JSONEncoder().encode(Body(query: query, variables: variables))
        } catch {
            throw VisualAPIError(code: .apiError, detail: "Could not encode the request.")
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch is CancellationError {
            throw CancellationError()
        } catch let error as URLError where error.code == .cancelled {
            throw CancellationError()
        } catch let error as URLError {
            throw VisualAPIError(code: .networkFailure, detail: Self.describe(error))
        } catch {
            throw VisualAPIError(code: .networkFailure)
        }

        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        if status == 401 || status == 403 {
            throw VisualAPIError(code: .invalidCredentials, statusCode: status)
        }
        guard (200..<300).contains(status) else {
            throw VisualAPIError(code: .apiError, detail: "HTTP \(status).", statusCode: status)
        }

        let envelope: Envelope<Result>
        do {
            envelope = try JSONDecoder().decode(Envelope<Result>.self, from: data)
        } catch {
            throw VisualAPIError(code: .apiError, detail: "Unexpected response format.", statusCode: status)
        }
        if let errors = envelope.errors, !errors.isEmpty {
            throw VisualAPIError(code: .apiError, detail: errors.map(\.message).joined(separator: ", "), statusCode: status)
        }
        guard let payload = envelope.data, payload.hasResult else {
            throw VisualAPIError(code: .apiError, detail: "The response has no result.", statusCode: status)
        }
        return payload.result
    }

    /// A short reason for common failures. System messages can be missing or only show the error number.
    private static func describe(_ error: URLError) -> String {
        switch error.code {
        case .timedOut: return "The request timed out."
        case .notConnectedToInternet: return "No internet connection."
        case .cannotFindHost, .dnsLookupFailed: return "Could not find the server. Check the region."
        case .cannotConnectToHost: return "Could not connect to the server."
        case .networkConnectionLost: return "The network connection was lost."
        case .secureConnectionFailed, .serverCertificateUntrusted, .serverCertificateHasBadDate,
             .serverCertificateNotYetValid, .serverCertificateHasUnknownRoot:
            return "Could not establish a secure connection."
        default: return "URL error \(error.code.rawValue)."
        }
    }

    private struct Body<Variables: Encodable>: Encodable {
        let query: String
        let variables: Variables
    }

    private struct Envelope<Result: Decodable>: Decodable {
        /// Tells a missing `result` field apart from an explicit `null`.
        struct Payload: Decodable {
            let hasResult: Bool
            let result: Result?

            private enum CodingKeys: String, CodingKey { case result }

            init(from decoder: Decoder) throws {
                let container = try decoder.container(keyedBy: CodingKeys.self)
                hasResult = container.contains(.result)
                result = hasResult ? try container.decode(Result?.self, forKey: .result) : nil
            }
        }
        struct GraphQLError: Decodable { let message: String }
        let data: Payload?
        let errors: [GraphQLError]?
    }
}
