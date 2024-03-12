using Newtonsoft.Json;

namespace SauceLabs.Visual.GraphQL
{
    internal class CreateBuild
    {
        [JsonProperty("id")]
        public string Id { get; }
        [JsonProperty("name")]
        public string Name { get; }
        [JsonProperty("url")]
        public string Url { get; }
        [JsonProperty("project")]
        public string? Project { get; }
        [JsonProperty("branch")]
        public string? Branch { get; }
        [JsonProperty("customId")]
        public string? CustomId { get; }

        public CreateBuild(string id, string name, string url, string? project, string? branch, string? customId)
        {
            Id = id;
            Name = name;
            Url = url;
            Project = project;
            Branch = branch;
            CustomId = customId;
        }
    }
}