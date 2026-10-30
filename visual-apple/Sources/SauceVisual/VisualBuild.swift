import Foundation

/// Build details. Anything left `nil` is read from its environment variable.
public struct VisualBuildOptions: Hashable, Sendable {
    /// Build name shown in the Sauce Visual dashboard. Falls back to `SAUCE_VISUAL_BUILD_NAME`.
    public var name: String?
    /// Project to associate the build with. Falls back to `SAUCE_VISUAL_PROJECT`.
    public var project: String?
    /// Your current git branch. Falls back to `SAUCE_VISUAL_BRANCH`.
    public var branch: String?
    /// Branch that baselines come from, usually `main`. Falls back to `SAUCE_VISUAL_DEFAULT_BRANCH`.
    public var defaultBranch: String?
    /// Your own build ID. A running build with this ID is reused, otherwise one is created with it.
    /// Falls back to `SAUCE_VISUAL_CUSTOM_ID`.
    public var customId: String?
    /// Existing Sauce Visual build UUID to add snapshots to. Falls back to `SAUCE_VISUAL_BUILD_ID`.
    /// If no build has this ID, `build()` throws `VisualError.buildNotFound` rather than creating one.
    public var buildId: String?
    /// Seconds the service waits before finishing a shared build, so other workers can still add snapshots.
    /// Needs a `customId`. Each worker then finishes the build when its tests end, and the service finishes it
    /// once this long has passed since the last worker did. Rounded up to whole seconds.
    public var finishDelay: TimeInterval?
    /// Tags for a new build; a reused build keeps its own. Falls back to `SAUCE_VISUAL_TAGS`, a comma-separated
    /// list. An empty list means no tags.
    public var tags: [String]?

    public init(
        name: String? = nil,
        project: String? = nil,
        branch: String? = nil,
        defaultBranch: String? = nil,
        customId: String? = nil,
        buildId: String? = nil,
        finishDelay: TimeInterval? = nil,
        tags: [String]? = nil
    ) {
        self.name = name
        self.project = project
        self.branch = branch
        self.defaultBranch = defaultBranch
        self.customId = customId
        self.buildId = buildId
        self.finishDelay = finishDelay
        self.tags = tags
    }

    /// Fills empty fields from the environment and trims whitespace.
    public func resolved(
        with environment: [String: String] = ProcessInfo.processInfo.environment
    ) -> VisualBuildOptions {
        func pick(_ value: String?, _ key: String) -> String? {
            for candidate in [value, environment[key]] {
                let trimmed = candidate?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
                if !trimmed.isEmpty { return trimmed }
            }
            return nil
        }
        return VisualBuildOptions(
            name: pick(name, "SAUCE_VISUAL_BUILD_NAME"),
            project: pick(project, "SAUCE_VISUAL_PROJECT"),
            branch: pick(branch, "SAUCE_VISUAL_BRANCH"),
            defaultBranch: pick(defaultBranch, "SAUCE_VISUAL_DEFAULT_BRANCH"),
            customId: pick(customId, "SAUCE_VISUAL_CUSTOM_ID"),
            buildId: pick(buildId, "SAUCE_VISUAL_BUILD_ID"),
            finishDelay: finishDelay,
            tags: tags.map(Self.cleaned) ?? Self.parseTags(environment["SAUCE_VISUAL_TAGS"])
        )
    }

    /// Tags from a comma-separated list, or `nil` when there are none.
    private static func parseTags(_ list: String?) -> [String]? {
        guard let list else { return nil }
        let tags = cleaned(list.components(separatedBy: ","))
        return tags.isEmpty ? nil : tags
    }

    private static func cleaned(_ tags: [String]) -> [String] {
        tags.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
    }

    /// Whether the build is named by an ID, so other workers may share it.
    internal var namesBuild: Bool { buildId != nil || customId != nil }

    /// `finishDelay` in whole seconds, as the API expects.
    internal var finishDelaySeconds: Int? {
        finishDelay.flatMap { Int(exactly: $0.rounded(.up)) }
    }

    /// Checks `finishDelay` on resolved options.
    /// - Throws: `VisualError.invalidFinishDelay` without a `customId`, or for a negative or too large delay.
    internal func validateFinishDelay() throws {
        guard let finishDelay else { return }
        guard customId != nil, finishDelay >= 0, let seconds = finishDelaySeconds, seconds <= Int(Int32.max) else {
            throw VisualError.invalidFinishDelay
        }
    }
}

public struct VisualBuild: Hashable, Sendable {
    public let id: String
    public let name: String?
    public let project: String?
    public let branch: String?
    public let defaultBranch: String?
    /// Server status, for example `RUNNING`, `EQUAL`, or `UNAPPROVED`.
    public let status: String?
    public let url: String?
    public let customId: String?

    public init(
        id: String,
        name: String? = nil,
        project: String? = nil,
        branch: String? = nil,
        defaultBranch: String? = nil,
        status: String? = nil,
        url: String? = nil,
        customId: String? = nil
    ) {
        self.id = id
        self.name = name
        self.project = project
        self.branch = branch
        self.defaultBranch = defaultBranch
        self.status = status
        self.url = url
        self.customId = customId
    }
}
