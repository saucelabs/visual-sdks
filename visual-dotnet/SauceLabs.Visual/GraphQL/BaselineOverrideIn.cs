using Newtonsoft.Json;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual.GraphQL
{
    internal class BaselineOverrideIn
    {
        [JsonProperty("browser", NullValueHandling = NullValueHandling.Ignore)]
        public Browser? Browser { get; set; }
        [JsonProperty("browserVersion", NullValueHandling = NullValueHandling.Ignore)]
        public string? BrowserVersion { get; set; }
        [JsonProperty("device", NullValueHandling = NullValueHandling.Ignore)]
        public string? Device { get; set; }
        [JsonProperty("name", NullValueHandling = NullValueHandling.Ignore)]
        public string? Name { get; set; }
        [JsonProperty("operatingSystem", NullValueHandling = NullValueHandling.Ignore)]
        public OperatingSystem? OperatingSystem { get; set; }
        [JsonProperty("operatingSystemVersion", NullValueHandling = NullValueHandling.Ignore)]
        public string? OperatingSystemVersion { get; set; }
        [JsonProperty("suiteName", NullValueHandling = NullValueHandling.Ignore)]
        public string? SuiteName { get; set; }
        [JsonProperty("testName", NullValueHandling = NullValueHandling.Ignore)]
        public string? TestName { get; set; }
    }
}