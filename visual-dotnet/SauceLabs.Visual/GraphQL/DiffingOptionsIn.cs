using Newtonsoft.Json;

namespace SauceLabs.Visual.GraphQL
{
    public class DiffingOptionsIn
    {
        [JsonProperty("content")]
        public bool Content { get; set; }
        [JsonProperty("dimensions")]
        public bool Dimensions { get; set; }
        [JsonProperty("position")]
        public bool Position { get; set; }
        [JsonProperty("structure")]
        public bool Structure { get; set; }
        [JsonProperty("style")]
        public bool Style { get; set; }
        [JsonProperty("visual")]
        public bool Visual { get; set; }

        public DiffingOptionsIn(bool defaultValue)
        {
            Content = defaultValue;
            Dimensions = defaultValue;
            Position = defaultValue;
            Structure = defaultValue;
            Style = defaultValue;
            Visual = defaultValue;
        }
    }
}