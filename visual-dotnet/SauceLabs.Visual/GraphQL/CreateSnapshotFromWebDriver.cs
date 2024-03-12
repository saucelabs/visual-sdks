using Newtonsoft.Json;

namespace SauceLabs.Visual.GraphQL
{
    internal class CreateSnapshotFromWebDriver
    {
        [JsonProperty("id")]
        public string Id { get; }
        [JsonProperty("uploadId")]
        public string UploadId { get; }
        [JsonProperty("diffs")]
        public DiffConnection Diffs { get; set; }

        public CreateSnapshotFromWebDriver(string id, string uploadId, DiffConnection diffs)
        {
            Id = id;
            UploadId = uploadId;
            Diffs = diffs;
        }
    }
}