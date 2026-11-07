import Foundation

/// What the capture itself established; this is not a visual comparison verdict.
#if canImport(ObjectiveC)
@objc(SLVCaptureExtent)
#endif
public enum VisualCaptureExtent: Int, Hashable, Sendable {
    /// One viewport or clipped element, without scrolling.
    case viewport = 0
    /// Scrolling stopped after unambiguous image alignment reported zero movement.
    /// This is not a guarantee that a lazily loaded or externally changing page has no more content.
    case noMovementDetected = 1
    /// The caller explicitly allowed a bounded prefix at the screenshot limit.
    case limitReached = 2
}

/// Receipt for a submitted snapshot. Comparison results are obtained from Sauce Visual separately.
public struct VisualSnapshot: Hashable, Sendable {
    public let id: String
    public let name: String
    public let buildId: String
    public let testName: String?
    public let suiteName: String?
    public let captureExtent: VisualCaptureExtent
    /// True only when the requested element tree was successfully uploaded with this snapshot.
    /// This does not claim the service completed a DOM-based comparison.
    public let hasDom: Bool
    /// Local encoded image dimensions; zero for an internally supplied opaque fixture.
    public let pixelWidth: Int
    public let pixelHeight: Int

    public init(
        id: String, name: String, buildId: String,
        testName: String? = nil, suiteName: String? = nil,
        captureExtent: VisualCaptureExtent = .viewport, hasDom: Bool = false,
        pixelWidth: Int = 0, pixelHeight: Int = 0
    ) {
        self.id = id
        self.name = name
        self.buildId = buildId
        self.testName = testName
        self.suiteName = suiteName
        self.captureExtent = captureExtent
        self.hasDom = hasDom
        self.pixelWidth = pixelWidth
        self.pixelHeight = pixelHeight
    }
}
