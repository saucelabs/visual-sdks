import SwiftUI

@main
struct SmokeHost: App {
    var body: some Scene { WindowGroup { content } }

    @ViewBuilder private var content: some View {
        let arguments = ProcessInfo.processInfo.arguments
        if arguments.contains("-fullPageList") {
            rows(40)
        } else if arguments.contains("-fullPageShortList") {
            rows(3)
        } else if arguments.contains("-fullPageInset") {
            VStack(spacing: 0) {
                Text("Header").frame(maxWidth: .infinity, minHeight: 120).background(Color.orange.opacity(0.3))
                // This completion fixture must fit within the default ten-frame capture budget.
                rows(12).frame(height: 300)
                Text("Footer").frame(maxWidth: .infinity, minHeight: 120).background(Color.green.opacity(0.3))
            }
        } else if arguments.contains("-fullPageScrollView") {
            ScrollView {
                VStack(spacing: 0) {
                    ForEach(0..<8, id: \.self) { block in
                        marker("Block \(block)", seed: block + 100, height: CGFloat(40 + (block % 4) * 30))
                    }
                }
            }
            // A bounded viewport stays inside the safe area on every platform. The eight mixed
            // rows still require multiple overlapping captures without making this a long stress test.
            .frame(height: 300)
            .accessibilityIdentifier("fullPageList")
        } else {
            Text("SauceVisual SDK integration host").padding()
        }
    }

    private func rows(_ count: Int) -> some View {
        ScrollView {
            VStack(spacing: 0) {
                ForEach(0..<count, id: \.self) { row in
                    marker("Row \(row)", seed: row, height: 64)
                }
            }
        }.accessibilityIdentifier("fullPageList")
    }

    /// A deterministic, non-periodic image fixture. Alignment ambiguity is tested separately in unit
    /// tests; a positive live fixture must contain enough observable detail to establish movement.
    private func marker(_ title: String, seed: Int, height: CGFloat) -> some View {
        Text(title)
            .foregroundStyle(Color.white)
            .frame(maxWidth: .infinity, minHeight: height, maxHeight: height)
            .background {
                Canvas { context, size in
                    for row in 0..<Int(size.height.rounded(.up)) {
                        let value = UInt32(seed * 257 + row + 1) &* 2_654_435_761
                        let color = Color(
                            red: Double((value >> 16) & 0x7f) / 255,
                            green: Double((value >> 8) & 0x7f) / 255,
                            blue: Double(value & 0x7f) / 255
                        )
                        context.fill(Path(CGRect(x: 0, y: CGFloat(row), width: size.width, height: 1)), with: .color(color))
                    }
                }.accessibilityHidden(true)
            }
    }
}
