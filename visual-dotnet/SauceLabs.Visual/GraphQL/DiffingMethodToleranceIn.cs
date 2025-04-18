using Newtonsoft.Json;

namespace SauceLabs.Visual.GraphQL
{
    internal class DiffingMethodToleranceIn
    {
        [JsonProperty("minChangeSize")]
        public int? MinChangeSize { get; set; }
        [JsonProperty("color")]
        public double? Color { get; set; }
        [JsonProperty("antiAliasing")]
        public double? AntiAliasing { get; set; }
        [JsonProperty("brightness")]
        public double? Brightness { get; set; }
    }
}