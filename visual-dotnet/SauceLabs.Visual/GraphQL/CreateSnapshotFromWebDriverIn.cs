using Newtonsoft.Json;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual.GraphQL
{
    internal class CreateSnapshotFromWebDriverIn
    {
        [JsonProperty("buildUuid")]
        public string BuildUuid { get; }
        [JsonProperty("diffingMethod")]
        public DiffingMethod DiffingMethod { get; }
        [JsonProperty("diffingOptions")]
        public DiffingOptionsIn? DiffingOptions { get; set; }
        [JsonProperty("ignoreRegions")]
        public RegionIn[] IgnoreRegions { get; }
        [JsonProperty("ignoreElements")]
        public ElementIn[]? IgnoreElements { get; }
        [JsonProperty("jobId")]
        public string JobId { get; }
        [JsonProperty("name")]
        public string Name { get; }
        [JsonProperty("sessionId")]
        public string SessionId { get; }
        [JsonProperty("sessionMetadata")]
        public string SessionMetadata { get; }
        [JsonProperty("suiteName")]
        public string? SuiteName { get; set; }
        [JsonProperty("testName")]
        public string? TestName { get; set; }
        [JsonProperty("captureDom")]
        public bool? CaptureDom { get; set; }
        [JsonProperty("baselineOverride")]
        public BaselineOverrideIn? BaselineOverride { get; set; }
        [JsonProperty("clipElement")]
        public string? ClipElement { get; set; }
        [JsonProperty("fullPageConfig")]
        public FullPageConfigIn? FullPageConfig { get; set; }
        [JsonProperty("hideScrollBars")]
        public bool? HideScrollBars { get; set; }
        [JsonProperty("diffingMethodTolerance")]
        public DiffingMethodToleranceIn? DiffingMethodTolerance { get; set; }
        [JsonProperty("diffingMethodSensitivity")]
        public DiffingMethodSensitivity? DiffingMethodSensitivity { get; set; }

        public CreateSnapshotFromWebDriverIn(
            string buildUuid,
            string name,
            string jobId,
            string sessionId,
            string sessionMetadata,
            DiffingMethod diffingMethod,
            RegionIn[] regions,
            bool captureDom,
            string? clipElement,
            string? suiteName,
            string? testName,
            ElementIn[]? ignoredElements,
            FullPageConfigIn? fullPageConfig,
            DiffingOptionsIn? diffingOptions,
            BaselineOverrideIn? baselineOverride,
            bool? hideScrollBars,
            DiffingMethodTolerance? diffingMethodTolerance,
            DiffingMethodSensitivity? diffingMethodSensitivity
        )
        {
            BuildUuid = buildUuid;
            DiffingMethod = diffingMethod;
            IgnoreRegions = regions;
            IgnoreElements = ignoredElements;
            JobId = jobId;
            Name = name;
            SessionMetadata = sessionMetadata;
            SessionId = sessionId;
            CaptureDom = captureDom;
            ClipElement = clipElement;
            SuiteName = suiteName;
            TestName = testName;
            FullPageConfig = fullPageConfig;
            DiffingOptions = diffingOptions;
            BaselineOverride = baselineOverride;
            HideScrollBars = hideScrollBars;
            DiffingMethodTolerance = diffingMethodTolerance?.ToDiffingMethodToleranceIn();
            DiffingMethodSensitivity = diffingMethodSensitivity;
        }
    }
}