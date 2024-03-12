using Newtonsoft.Json;

namespace SauceLabs.Visual.GraphQL
{
    internal class FinishBuild
    {
        [JsonProperty("id")]
        public string Id { get; }
        [JsonProperty("name")]
        public string Name { get; }
        [JsonProperty("url")]
        public string Url { get; }
        [JsonProperty("status")]
        public string Status { get; }

        public FinishBuild(string id, string name, string url, string status)
        {
            Id = id;
            Name = name;
            Url = url;
            Status = status;
        }
    }
}