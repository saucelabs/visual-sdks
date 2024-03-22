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
        [JsonProperty("ignoreRegions")]
        public RegionIn[] IgnoreRegions { get; }
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

        [JsonProperty("clipSelector")]
        public string? ClipSelector { get; set; }

        public CreateSnapshotFromWebDriverIn(
            string buildUuid,
            string name,
            string jobId,
            string sessionId,
            string sessionMetadata,
            DiffingMethod diffingMethod,
            RegionIn[] regions,
            bool captureDom,
            string? clipSelector
        )
        {
            BuildUuid = buildUuid;
            DiffingMethod = diffingMethod;
            IgnoreRegions = regions;
            JobId = jobId;
            Name = name;
            SessionMetadata = sessionMetadata;
            SessionId = sessionId;
            CaptureDom = captureDom;
            ClipSelector = clipSelector;
        }
    }
}