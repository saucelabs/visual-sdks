import Foundation

/// Sent in the `User-Agent` header. Keep in sync with `MARKETING_VERSION` in `Configuration/SDK.xcconfig`.
internal let sauceVisualVersion = "0.1.0"

/// A small GraphQL client for the Sauce Visual API. Safe to share.
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
            throw VisualAPIError(code: .apiError, detail: "Could not encode the request.", mayHaveBeenApplied: false)
        }

        let (data, status) = try await Self.send(request, with: session)
        if status == 401 || status == 403 {
            throw VisualAPIError(code: .invalidCredentials, statusCode: status, mayHaveBeenApplied: false)
        }
        guard (200..<300).contains(status) else {
            // A 4xx refuses the request. A 5xx may come after the server already applied it.
            throw VisualAPIError(
                code: .apiError, detail: "HTTP \(status).", statusCode: status,
                mayHaveBeenApplied: !(400..<500).contains(status)
            )
        }

        let envelope: Envelope<Result>
        do {
            envelope = try JSONDecoder().decode(Envelope<Result>.self, from: data)
        } catch {
            throw VisualAPIError(code: .apiError, detail: "Unexpected response format.", statusCode: status)
        }
        if let errors = envelope.errors, !errors.isEmpty {
            // Server messages are left out: they become NSError text, which apps and CI logs print.
            throw VisualAPIError(
                code: .apiError, detail: "The GraphQL operation failed.", statusCode: status,
                mayHaveBeenApplied: envelope.data?.result != nil
            )
        }
        guard let payload = envelope.data, payload.hasResult else {
            throw VisualAPIError(code: .apiError, detail: "The response has no result.", statusCode: status)
        }
        return payload.result
    }

    /// Sends `request` and returns the body and HTTP status.
    /// - Throws: `VisualAPIError(.networkFailure)` when the server can't be reached, or `CancellationError`.
    static func send(_ request: URLRequest, with session: URLSession) async throws -> (Data, Int) {
        do {
            let (data, response) = try await session.data(for: request)
            return (data, (response as? HTTPURLResponse)?.statusCode ?? 0)
        } catch is CancellationError {
            throw CancellationError()
        } catch let error as URLError where error.code == .cancelled {
            throw CancellationError()
        } catch let error as URLError {
            throw VisualAPIError(
                code: .networkFailure, detail: Self.describe(error), mayHaveBeenApplied: !Self.neverSent(error)
            )
        } catch {
            throw VisualAPIError(code: .networkFailure)
        }
    }

    /// Failures that happen before the request is sent, so the server never saw it.
    private static func neverSent(_ error: URLError) -> Bool {
        switch error.code {
        case .notConnectedToInternet, .cannotFindHost, .dnsLookupFailed, .cannotConnectToHost, .badURL,
             .unsupportedURL, .secureConnectionFailed, .serverCertificateUntrusted, .serverCertificateHasBadDate,
             .serverCertificateNotYetValid, .serverCertificateHasUnknownRoot, .clientCertificateRejected,
             .clientCertificateRequired, .appTransportSecurityRequiresSecureConnection, .dataNotAllowed,
             .internationalRoamingOff, .callIsActive:
            return true
        default:
            return false
        }
    }

    /// A readable reason for common network errors, since system messages are often just a number.
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
        /// Only the presence of errors is used, never their text.
        struct GraphQLError: Decodable {}
        let data: Payload?
        let errors: [GraphQLError]?
    }
}
