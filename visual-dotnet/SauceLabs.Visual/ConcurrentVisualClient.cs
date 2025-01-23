using System;
using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using OpenQA.Selenium;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual
{
    /// <summary>
    /// <c>VisualClient</c> provides an access to Sauce Labs Visual services.
    /// </summary>
    [Obsolete("This is an unstable API. It may change in the future.")]
    public class ConcurrentVisualClient : AbstractVisualClient, IDisposable
    {
        // Stores VisualClientV2, indexed by region
        private static readonly ConcurrentDictionary<Region, ConcurrentVisualClient> Instances = new ConcurrentDictionary<Region, ConcurrentVisualClient>();

        // Stores session metadata, indexed by sessionId
        private readonly ConcurrentDictionary<string, WebDriverSessionInfo> _sessionsMetadata = new ConcurrentDictionary<string, WebDriverSessionInfo>();

        private readonly VisualApi _api;
        private VisualBuild Build { get; set; }

        private string? _previousSuiteName;

        /// <summary>
        /// Get the instance of <c>VisualClient</c> for <c>region</c>
        /// </summary>
        /// <param name="region">target region</param>
        /// <param name="buildOptions">the options of the build creation</param>
        public static async Task<ConcurrentVisualClient> Get(CreateBuildOptions buildOptions, Region region)
        {
            return await Get(buildOptions, region, VisualCredential.CreateFromEnvironment());
        }

        /// <summary>
        /// Get the instance of <c>VisualClient</c> for <c>region</c>
        /// </summary>
        /// <param name="region">target region</param>
        /// <param name="creds">Credentials to be used</param>
        /// <param name="buildOptions">the options of the build creation</param>
        public static async Task<ConcurrentVisualClient> Get(CreateBuildOptions buildOptions, Region region, VisualCredential creds)
        {
            var client = await Instances.GetOrAddAsync(region, async (key) =>
            {
                var client = new ConcurrentVisualClient(key, creds);
                client.Build = await BuildFactory.Get(client._api, buildOptions);
                return client;
            });
            return client;
        }

        /**
         * When should be deleted all the instances ?
         */
        public static async Task Finish()
        {
            var keys = Instances.Keys;
            foreach (var key in keys)
            {
                ConcurrentVisualClient client;
                Instances.TryRemove(key, out client);

                await client._api.FinishBuild(client.Build.Id);
                client.Dispose();
            }
        }

        public void Dispose()
        {
            _api.Dispose();
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="region">the Sauce Labs region to connect to</param>
        /// <param name="creds">the Sauce Labs credentials</param>
        private ConcurrentVisualClient(Region region, VisualCredential creds)
        {
            if (StringUtils.IsNullOrEmpty(creds.Username) || StringUtils.IsNullOrEmpty(creds.AccessKey))
            {
                throw new VisualClientException("Username or Access Key not set");
            }

            _api = new VisualApi(region, creds.Username, creds.AccessKey);
        }

        /// <summary>
        /// <c>VisualCheck</c> captures a screenshot and queue it for processing.
        /// </summary>
        /// <param name="wd">the webdriver instance where the snapshot should be taken</param>
        /// <param name="name">the name of the screenshot</param>
        /// <param name="options">the configuration for the screenshot capture and comparison</param>
        /// <param name="callerMemberName">the member name of the caller (automated) </param>
        /// <returns></returns>
        public Task<string> VisualCheck(
            WebDriver wd,
            string name,
            VisualCheckOptions? options = null,
            [CallerMemberName] string callerMemberName = "")
        {
            options ??= new VisualCheckOptions();
            options.EnsureTestContextIsPopulated(callerMemberName, _previousSuiteName);
            _previousSuiteName = options.SuiteName;
            return VisualCheckAsync(wd, name, options);
        }

        private async Task<string> VisualCheckAsync(
            WebDriver wd,
            string name,
            VisualCheckOptions options)
        {

            var sessionId = wd.SessionId.ToString();
            var jobId = wd.Capabilities.HasCapability("jobUuid") ? wd.Capabilities.GetCapability("jobUuid").ToString() : sessionId;

            var sessionMetadata = await _sessionsMetadata.GetOrAddAsync(sessionId, async (_) =>
            {
                var res = await _api.WebDriverSessionInfo(sessionId, jobId);
                return res.EnsureValidResponse().Result;
            });

            return await VisualCheckBaseAsync(_api, Build, name, options, jobId, sessionId, sessionMetadata.Blob);
        }
    }
}