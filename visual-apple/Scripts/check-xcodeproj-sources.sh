#!/bin/bash
# Verify actual source-phase membership in all platform framework targets.
# No project generation and no third-party parser. plutil reads Xcode's property list.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd -P)
work=$(mktemp -d "${TMPDIR:-/tmp}/saucevisual-membership.XXXXXXXX")
trap 'rm -rf "$work"' EXIT
plutil -convert json -o "$work/project.json" "$root/SauceVisual.xcodeproj/project.pbxproj"
cat > "$work/check.swift" <<'SWIFT'
import Foundation

struct InvalidProject: Error, CustomStringConvertible {
    let description: String
    init(_ description: String) { self.description = description }
}

func check(projectURL: URL, sourceRoot: URL) throws {
    let data = try Data(contentsOf: projectURL)
    guard let document = try JSONSerialization.jsonObject(with: data) as? [String: Any],
          let objects = document["objects"] as? [String: [String: Any]],
          let rootID = document["rootObject"] as? String,
          let project = objects[rootID],
          let targetIDs = project["targets"] as? [String] else {
        throw InvalidProject("Malformed Xcode project graph")
    }
    var parents: [String: [String]] = [:]
    for (id, object) in objects where ["PBXGroup", "PBXVariantGroup"].contains(object["isa"] as? String ?? "") {
        for child in object["children"] as? [String] ?? [] { parents[child, default: []].append(id) }
    }
    func path(_ id: String, visiting: Set<String> = []) throws -> URL {
        guard !visiting.contains(id), let object = objects[id] else {
            throw InvalidProject("Missing or cyclic file/group reference: \(id)")
        }
        var visiting = visiting; visiting.insert(id)
        let tree = object["sourceTree"] as? String ?? "<group>"
        let base: URL
        switch tree {
        case "SOURCE_ROOT": base = sourceRoot
        case "<group>":
            let owners = parents[id] ?? []
            guard owners.count <= 1 else { throw InvalidProject("Ambiguous parent group for \(id)") }
            base = try owners.first.map { try path($0, visiting: visiting) } ?? sourceRoot
        default: throw InvalidProject("Unsupported source tree \(tree) for compiled source \(id)")
        }
        let component = object["path"] as? String ?? ""
        guard !component.hasPrefix("/"), !component.contains("$(") else {
            throw InvalidProject("Non-portable source path: \(component)")
        }
        return base.appendingPathComponent(component).standardizedFileURL
    }
    let sourceDirectory = sourceRoot.appendingPathComponent("Sources/SauceVisual")
    guard let enumerator = FileManager.default.enumerator(at: sourceDirectory,
                                                        includingPropertiesForKeys: [.isRegularFileKey]) else {
        throw InvalidProject("Could not enumerate SDK sources")
    }
    var expected = Set<String>()
    for case let url as URL in enumerator where url.pathExtension == "swift" {
        guard try url.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile == true else { continue }
        expected.insert(url.standardizedFileURL.path)
    }
    guard !expected.isEmpty else { throw InvalidProject("No SDK Swift sources found") }
    let loader = sourceRoot.appendingPathComponent("Sources/SauceVisualLoader/SauceVisualLoader.c").standardizedFileURL.path
    guard FileManager.default.fileExists(atPath: loader) else { throw InvalidProject("Missing observer loader source") }
    expected.insert(loader)

    let requiredTargets: Set<String> = ["SauceVisual-iOS", "SauceVisual-tvOS", "SauceVisual-macOS"]
    let targets = targetIDs.compactMap { id -> (String, [String: Any])? in
        guard let object = objects[id], object["productType"] as? String == "com.apple.product-type.framework",
              let name = object["name"] as? String else { return nil }
        return (name, object)
    }
    guard Set(targets.map(\.0)) == requiredTargets, targets.count == requiredTargets.count else {
        throw InvalidProject("Expected exactly the three documented framework targets")
    }
    for (name, target) in targets {
        guard let phaseIDs = target["buildPhases"] as? [String] else { throw InvalidProject("Missing phases in \(name)") }
        let phases = phaseIDs.compactMap { objects[$0] }.filter { $0["isa"] as? String == "PBXSourcesBuildPhase" }
        guard phases.count == 1, let entries = phases[0]["files"] as? [String] else {
            throw InvalidProject("Expected one source phase in \(name)")
        }
        var built = Set<String>()
        for entry in entries {
            guard let buildFile = objects[entry], buildFile["isa"] as? String == "PBXBuildFile",
                  let reference = buildFile["fileRef"] as? String else {
                throw InvalidProject("Invalid source build entry \(entry) in \(name)")
            }
            let resolved = try path(reference).path
            guard built.insert(resolved).inserted else { throw InvalidProject("Duplicate compiled source in \(name): \(resolved)") }
            guard FileManager.default.fileExists(atPath: resolved) else { throw InvalidProject("Missing compiled source: \(resolved)") }
        }
        let missing = expected.subtracting(built).sorted()
        guard missing.isEmpty else {
            throw InvalidProject("\(name) does not compile:\n" + missing.joined(separator: "\n"))
        }
        print("\(name): all \(expected.count) SDK/loader sources are in its source phase.")
    }
}

do {
    guard CommandLine.arguments.count == 3 else { throw InvalidProject("Expected project JSON and source root") }
    try check(projectURL: URL(fileURLWithPath: CommandLine.arguments[1]),
              sourceRoot: URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true))
} catch {
    FileHandle.standardError.write(Data("error: \(error)\n".utf8))
    exit(1)
}
SWIFT
xcrun swift "$work/check.swift" "$work/project.json" "$root"
