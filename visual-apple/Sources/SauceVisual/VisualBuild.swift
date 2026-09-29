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
    /// An existing build to add snapshots to. Falls back to `SAUCE_VISUAL_BUILD_ID`.
    public var buildId: String?

    public init(
        name: String? = nil,
        project: String? = nil,
        branch: String? = nil,
        defaultBranch: String? = nil,
        customId: String? = nil,
        buildId: String? = nil
    ) {
        self.name = name
        self.project = project
        self.branch = branch
        self.defaultBranch = defaultBranch
        self.customId = customId
        self.buildId = buildId
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
            buildId: pick(buildId, "SAUCE_VISUAL_BUILD_ID")
        )
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
