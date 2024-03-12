using Newtonsoft.Json;

namespace SauceLabs.Visual.GraphQL
{
    internal class ServerResponse<T>
    {
        [JsonProperty("result")]
        public T Result { get; }

        public ServerResponse(T result)
        {
            Result = result;
        }
    }
}