import SwiftUI

@main
struct SmokeHost: App {
    var body: some Scene {
        WindowGroup {
            // A long list for the full-page test, which launches the app with `-fullPageList`.
            if ProcessInfo.processInfo.arguments.contains("-fullPageList") {
                List(0..<40, id: \.self) { row in
                    Text("Row \(row)")
                }
                .accessibilityIdentifier("fullPageList")
            } else {
                Text("SauceVisual SDK integration host")
                    .padding()
            }
        }
    }
}
