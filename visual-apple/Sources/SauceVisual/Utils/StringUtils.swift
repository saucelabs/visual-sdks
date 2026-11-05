import Foundation

internal enum StringUtils {
    /// The string without leading or trailing whitespace and newlines.
    static func trimmed(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Each string trimmed, leaving out the ones that are then empty. `[" a ", " ", ""]` becomes `["a"]`.
    static func trimmedNonEmpty(_ values: [String]) -> [String] {
        values.map(trimmed).filter { !$0.isEmpty }
    }
}
