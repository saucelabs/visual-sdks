using System.Linq;
using GraphQL;

namespace SauceLabs.Visual.Utils
{
    public static class GraphQLResponseExtension
    {
        public static T EnsureValidResponse<T>(this GraphQLResponse<T> response)
        {
            if (response == null)
            {
                throw new VisualClientException("no response available");
            }

            if (response.Errors != null && response.Errors.Length > 0)
            {
                var errors = string.Join(",", response.Errors.Select(x => $"{x.Message}"));
                throw new VisualClientException($"Query Errors: {errors}");
            }

            if (response.Data == null)
            {
                throw new VisualClientException("response has no available payload");
            }
            return response.Data;
        }
    }
}
