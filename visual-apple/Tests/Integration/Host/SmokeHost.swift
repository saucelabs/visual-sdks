import SwiftUI

@main
struct SmokeHost: App {
    var body: some Scene {
        WindowGroup {
            content
        }
    }

    /// Full-page tests pick a screen with a launch argument. Without one, the app shows its usual text.
    @ViewBuilder private var content: some View {
        let arguments = ProcessInfo.processInfo.arguments
        if arguments.contains("-fullPageList") {
            rows(40)
        } else if arguments.contains("-fullPageShortList") {
            rows(3)
        } else if arguments.contains("-fullPageInset") {
            VStack(spacing: 0) {
                Text("Header").frame(maxWidth: .infinity, minHeight: 120).background(Color.orange.opacity(0.3))
                rows(40).frame(height: 300)
                Text("Footer").frame(maxWidth: .infinity, minHeight: 120).background(Color.green.opacity(0.3))
            }
        } else if arguments.contains("-fullPageScrollView") {
            ScrollView {
                VStack(spacing: 0) {
                    ForEach(0..<30, id: \.self) { block in
                        Text("Block \(block)")
                            .frame(maxWidth: .infinity, minHeight: CGFloat(40 + (block % 4) * 30))
                            .background(block.isMultiple(of: 2) ? Color.yellow.opacity(0.3) : Color.blue.opacity(0.2))
                    }
                }
            }
            .accessibilityIdentifier("fullPageList")
        } else {
            Text("SauceVisual SDK integration host")
                .padding()
        }
    }

    private func rows(_ count: Int) -> some View {
        List(0..<count, id: \.self) { row in
            Text("Row \(row)")
        }
        .accessibilityIdentifier("fullPageList")
    }
}
