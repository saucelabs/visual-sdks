import Foundation

/// Keep in sync with MARKETING_VERSION in Configuration/SDK.xcconfig.
internal let sauceVisualVersion = "0.1.0"

/// One GraphQL operation per request. Server-provided error text is never made loggable.
internal struct GraphQLTransport: Sendable {
    let endpoint: URL
    let credentials: VisualCredentials
    let session: URLSession

    /// Bounded defaults. A caller may still explicitly inject a differently configured API session.
    static let defaultSession: URLSession = {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        configuration.httpShouldSetCookies = false
        configuration.httpCookieStorage = nil
        configuration.urlCredentialStorage = nil
        configuration.urlCache = nil
        return URLSession(configuration: configuration)
    }()

    init(endpoint: URL, credentials: VisualCredentials, session: URLSession = GraphQLTransport.defaultSession) {
        self.endpoint = endpoint
        self.credentials = credentials
        self.session = session
    }

    /// Only an explicit, error-free `data.result: null` is a lookup miss.
    func execute<Variables: Encodable & Sendable, Result: Decodable & Sendable>(
        _ query: String, variables: Variables, as _: Result.Type
    ) async throws -> Result? {
        try Task.checkCancellation()
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
            // Authentication/authorization rejection is part of the API contract.
            throw VisualAPIError(code: .invalidCredentials, statusCode: status, mayHaveBeenApplied: false)
        }
        guard (200..<300).contains(status) else {
            // A generic HTTP status is not transaction/rollback evidence.
            throw VisualAPIError(code: .apiError, detail: "HTTP \(status).", statusCode: status)
        }
        return try decodeResult(data, status: status, as: Result.self)
    }

    /// Internal so response semantics can be tested without a transport or a service account.
    func decodeResult<Result: Decodable & Sendable>(
        _ data: Data, status: Int, as _: Result.Type
    ) throws -> Result? {
        let envelope: Envelope<Result>
        do {
            envelope = try JSONDecoder().decode(Envelope<Result>.self, from: data)
        } catch {
            throw VisualAPIError(code: .apiError, detail: "Unexpected response format.", statusCode: status)
        }
        if let errors = envelope.errors, !errors.isEmpty {
            // In GraphQL, omitted data distinguishes a pre-execution request error from an
            // execution result. Present-but-null data can follow a committed mutation.
            throw VisualAPIError(
                code: .apiError, detail: "The GraphQL operation failed.", statusCode: status,
                mayHaveBeenApplied: envelope.hasData || errors.contains(where: \.hasExecutionPath)
            )
        }
        guard let payload = envelope.data, payload.hasResult else {
            throw VisualAPIError(code: .apiError, detail: "The response has no result.", statusCode: status)
        }
        return payload.result
    }

    static func send(_ request: URLRequest, with session: URLSession) async throws -> (Data, Int) {
        try Task.checkCancellation()
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

    /// Local construction failures are safe to retry. Transport connectivity errors are kept
    /// uncertain: with retries or redirects, the final error alone cannot prove no request arrived.
    private static func neverSent(_ error: URLError) -> Bool {
        switch error.code {
        case .badURL, .unsupportedURL:
            return true
        default:
            return false
        }
    }

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

        struct GraphQLError: Decodable {
            let hasExecutionPath: Bool
            private enum CodingKeys: String, CodingKey { case message, path }

            init(from decoder: Decoder) throws {
                let container = try decoder.container(keyedBy: CodingKeys.self)
                // Validate the required member, but do not retain server-controlled text.
                _ = try container.decode(String.self, forKey: .message)
                // A malformed/null path is still not evidence that nothing executed.
                hasExecutionPath = container.contains(.path)
            }
        }

        let hasData: Bool
        let data: Payload?
        let errors: [GraphQLError]?
        private enum CodingKeys: String, CodingKey { case data, errors }

        init(from decoder: Decoder) throws {
            let container = try decoder.container(keyedBy: CodingKeys.self)
            hasData = container.contains(.data)
            data = try container.decodeIfPresent(Payload.self, forKey: .data)
            errors = try container.decodeIfPresent([GraphQLError].self, forKey: .errors)
        }
    }
}
