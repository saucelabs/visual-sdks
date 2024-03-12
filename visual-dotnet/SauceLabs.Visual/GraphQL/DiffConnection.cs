using Newtonsoft.Json;

namespace SauceLabs.Visual.GraphQL
{
    internal class DiffConnection
    {
        [JsonProperty("nodes")]
        public Diff[] Nodes { get; }

        public DiffConnection(Diff[] nodes)
        {
            Nodes = nodes;
        }
    }
}