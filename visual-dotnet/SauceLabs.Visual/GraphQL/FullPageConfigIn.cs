using Newtonsoft.Json;

namespace SauceLabs.Visual.GraphQL
{
    internal class FullPageConfigIn
    {
        [JsonProperty("delayAfterScrollMs")]
        public int? DelayAfterScrollMs { get; set; }
        [JsonProperty("hideAfterFirstScroll")]
        public string[]? HideAfterFirstScroll { get; set; }
    }
}