using Newtonsoft.Json;

namespace SauceLabs.Visual.GraphQL
{
    internal class CreateBuildIn
    {
        [JsonProperty("name")]
        public string? Name { get; set; }
        [JsonProperty("project")]
        public string? Project { get; set; }
        [JsonProperty("branch")]
        public string? Branch { get; set; }
        [JsonProperty("customId")]
        public string? CustomId { get; set; }
    }
}