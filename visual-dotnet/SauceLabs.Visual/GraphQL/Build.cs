using Newtonsoft.Json;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual.GraphQL
{
    internal class Build
    {
        [JsonProperty("id")]
        public string Id { get; }
        [JsonProperty("name")]
        public string Name { get; }
        [JsonProperty("url")]
        public string Url { get; }
        [JsonProperty("mode")]
        public BuildMode Mode { get; }

        public Build(string id, string name, string url, BuildMode mode)
        {
            Id = id;
            Name = name;
            Url = url;
            Mode = mode;
        }
    }
}