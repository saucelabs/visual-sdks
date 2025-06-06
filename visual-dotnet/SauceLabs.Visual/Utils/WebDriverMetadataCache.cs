using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace SauceLabs.Visual.Utils
{
    internal class WebDriverMetadataCache
    {
        private readonly ConcurrentDictionary<string, WebDriverMetadata> _cache = new ConcurrentDictionary<string, WebDriverMetadata>();

        public async Task<WebDriverMetadata> GetMetadata(VisualApi api, string sessionId, string jobId)
        {
            if (_cache.TryGetValue(sessionId, out var cached))
            {
                return cached;
            }

            var response = await api.WebDriverSessionInfo(jobId, sessionId);
            var metadataBlob = response.EnsureValidResponse().Result.Blob;
            var metadata = new WebDriverMetadata(sessionId, jobId, metadataBlob);

            // We don't care if this fails
            _cache.TryAdd(sessionId, metadata);

            return metadata;
        }
    }
}
