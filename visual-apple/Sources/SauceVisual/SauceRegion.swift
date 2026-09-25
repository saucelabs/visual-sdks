import Foundation

/// A Sauce Labs data center that hosts the Sauce Visual API.
public struct SauceRegion: Hashable, Sendable {
    public let name: String
    public let aliases: [String]
    public let graphqlEndpoint: URL

    public init(name: String, aliases: [String] = [], graphqlEndpoint: URL) {
        self.name = name
        self.aliases = aliases
        self.graphqlEndpoint = graphqlEndpoint
    }

    public static let usWest1 = SauceRegion(
        name: "us-west-1",
        aliases: ["us", "us-west-4-i3er"],
        graphqlEndpoint: URL(string: "https://api.us-west-1.saucelabs.com/v1/visual/graphql")!
    )

    public static let usEast4 = SauceRegion(
        name: "us-east-4",
        aliases: ["us-east-4-cm5i"],
        graphqlEndpoint: URL(string: "https://api.us-east-4.saucelabs.com/v1/visual/graphql")!
    )

    public static let euCentral1 = SauceRegion(
        name: "eu-central-1",
        aliases: ["eu", "eu-west-3-lnbf"],
        graphqlEndpoint: URL(string: "https://api.eu-central-1.saucelabs.com/v1/visual/graphql")!
    )

    public static let staging = SauceRegion(
        name: "staging",
        aliases: ["us-west-4-jeh6"],
        graphqlEndpoint: URL(string: "https://api.staging.saucelabs.net/v1/visual/graphql")!
    )

    /// Used when no region is given and `SAUCE_REGION` is unset or empty.
    public static let `default` = usWest1

    public static let all: [SauceRegion] = [usWest1, usEast4, euCentral1, staging]

    /// Looks up a region by name or alias. An empty name returns `default`.
    /// - Throws: `VisualError.unknownRegion`.
    public static func named(_ name: String) throws -> SauceRegion {
        let normalized = name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if normalized.isEmpty { return .default }
        guard let region = all.first(where: { $0.name == normalized || $0.aliases.contains(normalized) }) else {
            throw VisualError.unknownRegion
        }
        return region
    }

    /// Resolves `SAUCE_REGION`, falling back to `default`.
    /// - Throws: `VisualError.unknownRegion`.
    public static func fromEnvironment(
        _ environment: [String: String] = ProcessInfo.processInfo.environment
    ) throws -> SauceRegion {
        try named(environment["SAUCE_REGION"] ?? "")
    }
}
