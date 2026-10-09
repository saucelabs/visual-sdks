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

    struct Response<Result: Decodable & Sendable>: Sendable {
        let result: Result?
        let errorMessages: [String]
    }

    /// Sends one query or mutation. Its root field must be aliased as `result`.
    /// - Throws: `VisualAPIError` for network, HTTP, and response errors, or `CancellationError`.
    func execute<Variables: Encodable & Sendable, Result: Decodable & Sendable>(
        _ query: String,
        variables: Variables,
        as _: Result.Type
    ) async throws -> Response<Result> {
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

        let (data, status) = try await Self.send(request, with: session)
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
        return Response(
            result: envelope.data?.result,
            errorMessages: envelope.errors?.map(\.message) ?? []
        )
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
            throw VisualAPIError(code: .networkFailure, detail: Self.describe(error))
        } catch {
            throw VisualAPIError(code: .networkFailure)
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
        struct Payload: Decodable { let result: Result? }
        struct GraphQLError: Decodable { let message: String }
        let data: Payload?
        let errors: [GraphQLError]?
    }
}
