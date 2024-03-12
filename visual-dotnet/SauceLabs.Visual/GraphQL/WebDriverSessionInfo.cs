using Newtonsoft.Json;

namespace SauceLabs.Visual.GraphQL
{
    internal class WebDriverSessionInfo
    {
        [JsonProperty("blob")]
        public string Blob { get; }

        public WebDriverSessionInfo(string blob)
        {
            Blob = blob;
        }

        public override string ToString()
        {
            return $"WebDriverSessionInfo{{Blob={Blob}}}";
        }
    }
}