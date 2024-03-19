using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Threading.Tasks;
using GraphQL;
using GraphQL.Client.Http;
using GraphQL.Client.Serializer.Newtonsoft;
using Newtonsoft.Json;
using OpenQA.Selenium;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual
{
    internal class VisualApi<T> : IDisposable where T : IHasCapabilities, IHasSessionId
    {
        private readonly string _username;
        private readonly string _accessKey;
        private readonly GraphQLHttpClient _graphQlClient;

        public VisualApi(T webdriver, Region region, string username, string accessKey, HttpClient? httpClient = null)
        {

            if (StringUtils.IsNullOrEmpty(username) || StringUtils.IsNullOrEmpty(accessKey))
            {
                throw new VisualClientException(
                    "Invalid SauceLabs credentials. Please check your SauceLabs username and access key at https://app.saucelabs.com/user-setting");
            }
            _username = username.Trim();
            _accessKey = accessKey.Trim();

            httpClient ??= new HttpClient();

            var serializerOptions = new JsonSerializerSettings();
            serializerOptions.Converters.Add(new ConstantCaseEnumConverter());

            var currentAssembly = Assembly.GetExecutingAssembly().GetName();
            _graphQlClient = new GraphQLHttpClient(
                options: new GraphQLHttpClientOptions()
                {
                    EndPoint = region.Value,
                    DefaultUserAgentRequestHeader = new ProductInfoHeaderValue(currentAssembly.Name, currentAssembly.Version.ToString())
                },
                serializer: new NewtonsoftJsonSerializer(serializerOptions),
                httpClient);
        }

        public async Task<GraphQLResponse<ServerResponse<CreateBuild>>> CreateBuild(CreateBuildIn input)
        {
            var request = CreateAuthenticatedRequest(CreateBuildMutation.OperationDocument, CreateBuildMutation.OperationName, new { input });
            return await _graphQlClient.SendQueryAsync<ServerResponse<CreateBuild>>(request);
        }

        public async Task<GraphQLResponse<ServerResponse<FinishBuild>>> FinishBuild(string buildId)
        {
            var request = CreateAuthenticatedRequest(FinishBuildMutation.OperationDocument, FinishBuildMutation.OperationName, new
            {
                input = new
                {
                    uuid = buildId
                }
            });
            return await _graphQlClient.SendQueryAsync<ServerResponse<FinishBuild>>(request);
        }

        public async Task<GraphQLResponse<ServerResponse<Build>>> Build(string buildId)
        {
            var request = CreateAuthenticatedRequest(BuildQuery.OperationDocument, BuildQuery.OperationName, new
            {
                input = buildId
            });
            return await _graphQlClient.SendQueryAsync<ServerResponse<Build>>(request);
        }

        public async Task<GraphQLResponse<ServerResponse<Build>>> BuildByCustomId(string customId)
        {
            var request = CreateAuthenticatedRequest(BuildByCustomIdQuery.OperationDocument, BuildByCustomIdQuery.OperationName, new
            {
                input = customId
            });
            return await _graphQlClient.SendQueryAsync<ServerResponse<Build>>(request);
        }

        public async Task<GraphQLResponse<ServerResponse<WebDriverSessionInfo>>> WebDriverSessionInfo(string jobId, string sessionId)
        {
            var request = CreateAuthenticatedRequest(WebDriverSessionInfoQuery.OperationDocument, WebDriverSessionInfoQuery.OperationName, new { jobId, sessionId });
            return await _graphQlClient.SendQueryAsync<ServerResponse<WebDriverSessionInfo>>(request);
        }

        public async Task<GraphQLResponse<ServerResponse<CreateSnapshotFromWebDriver>>> CreateSnapshotFromWebDriver(
            CreateSnapshotFromWebDriverIn input)
        {
            var request = CreateAuthenticatedRequest(CreateSnapshotFromWebDriverMutation.OperationDocument, CreateSnapshotFromWebDriverMutation.OperationName, new { input });
            return await _graphQlClient.SendQueryAsync<ServerResponse<CreateSnapshotFromWebDriver>>(request);
        }

        public async Task<GraphQLResponse<ServerResponse<DiffConnection>>> DiffForTestResult(string buildId)
        {
            var request = CreateAuthenticatedRequest(DiffsFromBuildId.OperationDocument, DiffsFromBuildId.OperationName, new { input = buildId });
            return await _graphQlClient.SendQueryAsync<ServerResponse<DiffConnection>>(request);
        }

        private AuthenticatedGraphQLRequest CreateAuthenticatedRequest(string query, string operationName, object variables)
        {
            return new AuthenticatedGraphQLRequest
            {
                Username = _username,
                AccessKey = _accessKey,
                Query = query,
                OperationName = operationName,
                Variables = variables
            };
        }

        public void Dispose()
        {
            _graphQlClient.Dispose();
        }
    }
}