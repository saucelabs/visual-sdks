using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using GraphQL.Client.Abstractions;
using GraphQL.Client.Http;

namespace SauceLabs.Visual.Utils
{

    // ReSharper disable once InconsistentNaming
    internal class AuthenticatedGraphQLRequest : GraphQLHttpRequest
    {
        public string? Username { get; set; }
        public string? AccessKey { get; set; }

        public override HttpRequestMessage ToHttpRequestMessage(GraphQLHttpClientOptions options,
            IGraphQLJsonSerializer serializer)
        {
            var message = base.ToHttpRequestMessage(options, serializer);
            if (string.IsNullOrEmpty(Username) || string.IsNullOrEmpty(AccessKey))
            {
                return message;
            }

            var authenticationString = $"{Username}:{AccessKey}";
            var base64EncodedAuthenticationString =
                Convert.ToBase64String(Encoding.ASCII.GetBytes(authenticationString));
            message.Headers.Authorization = new AuthenticationHeaderValue("Basic", base64EncodedAuthenticationString);
            return message;
        }
    }
}