using Newtonsoft.Json;

namespace SauceLabs.Visual.GraphQL
{
    internal class FinishBuildResponse
    {
        [JsonProperty("result")]
        public FinishBuild Result { get; }

        public FinishBuildResponse(FinishBuild result)
        {
            Result = result;
        }
    }
}