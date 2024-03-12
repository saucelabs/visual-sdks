using Newtonsoft.Json;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual.GraphQL
{
    internal class Diff
    {
        [JsonProperty("id")]
        public string Id { get; }

        [JsonProperty("status")]
        public DiffStatus Status { get; }

        public Diff(string id, DiffStatus status)
        {
            Id = id;
            Status = status;
        }
    }
}