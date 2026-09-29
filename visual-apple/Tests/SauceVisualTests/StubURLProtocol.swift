import Foundation

/// Answers `URLSession` requests with canned responses, without using the network.
/// Each session gets its own queue of replies, so tests don't affect each other.
final class StubURLProtocol: URLProtocol, @unchecked Sendable {
    struct Reply: Sendable {
        var status: Int = 200
        var body: Data
        var error: URLError?

        static func json(_ object: Any, status: Int = 200) -> Reply {
            // Test fixtures are valid JSON objects.
            Reply(status: status, body: try! JSONSerialization.data(withJSONObject: object))
        }

        static func failure(_ code: URLError.Code) -> Reply {
            Reply(body: Data(), error: URLError(code))
        }
    }

    /// Records requests and returns queued replies, in order.
    final class Route: @unchecked Sendable {
        private let lock = NSLock()
        private var replies: [Reply]
        private var captured: [URLRequest] = []

        init(_ replies: [Reply]) { self.replies = replies }

        var requests: [URLRequest] { lock.locked { captured } }

        /// Decoded JSON bodies of every request, in order.
        var bodies: [[String: Any]] {
            requests.map { request in
                let data = request.httpBody ?? Data()
                return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
            }
        }

        fileprivate func next(for request: URLRequest) -> Reply {
            lock.locked {
                captured.append(request)
                return replies.isEmpty ? .json(["errors": [["message": "No stub left"]]]) : replies.removeFirst()
            }
        }
    }

    private static let lock = NSLock()
    nonisolated(unsafe) private static var routes: [String: Route] = [:]
    private static let header = "X-Stub-Route"

    /// A session whose requests are answered by `route`.
    static func session(_ route: Route) -> URLSession {
        let id = UUID().uuidString
        lock.locked { routes[id] = route }
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        configuration.httpAdditionalHeaders = [header: id]
        return URLSession(configuration: configuration)
    }

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let id = request.value(forHTTPHeaderField: Self.header) ?? ""
        guard let route = Self.lock.locked({ Self.routes[id] }) else {
            client?.urlProtocol(self, didFailWithError: URLError(.unsupportedURL))
            return
        }
        // URLSession turns the body into a stream, so read it back.
        var captured = request
        captured.httpBody = request.httpBody ?? request.httpBodyStream.map(Self.read)
        let reply = route.next(for: captured)
        if let error = reply.error {
            client?.urlProtocol(self, didFailWithError: error)
            return
        }
        let response = HTTPURLResponse(url: request.url!, statusCode: reply.status, httpVersion: "HTTP/1.1", headerFields: nil)!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: reply.body)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}

    private static func read(_ stream: InputStream) -> Data {
        stream.open()
        defer { stream.close() }
        var data = Data()
        var buffer = [UInt8](repeating: 0, count: 4096)
        while stream.hasBytesAvailable {
            let count = stream.read(&buffer, maxLength: buffer.count)
            if count <= 0 { break }
            data.append(buffer, count: count)
        }
        return data
    }
}

extension NSLock {
    /// Like `NSLocking.withLock`, which needs iOS 16 and macOS 13.
    func locked<T>(_ body: () throws -> T) rethrows -> T {
        lock()
        defer { unlock() }
        return try body()
    }
}
