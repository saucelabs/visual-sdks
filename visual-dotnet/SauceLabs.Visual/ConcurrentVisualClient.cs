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
    public class ConcurrentVisualClient : VisualClientBase
    {
        // Stores ConcurrentVisualClient, indexed by region
        private static readonly ConcurrentDictionary<Region, ConcurrentVisualClient> Instances = new ConcurrentDictionary<Region, ConcurrentVisualClient>();

        // Stores session metadata, indexed by sessionId
        private readonly ConcurrentDictionary<string, WebDriverSessionInfo> _sessionsMetadata = new ConcurrentDictionary<string, WebDriverSessionInfo>();

        /// <summary>
        /// Get the instance of <c>VisualClient</c> for <c>region</c>. Credentials are fetched from Environment.
        /// </summary>
        /// <param name="buildOptions">the options of the build creation</param>
        /// <param name="region">target region</param>
        public static async Task<ConcurrentVisualClient> Get(Region region, CreateBuildOptions buildOptions)
        {
            return await Get(region, VisualCredential.CreateFromEnvironment(), buildOptions);
        }

        /// <summary>
        /// Get the instance of <c>VisualClient</c> for <c>region</c>
        /// </summary>
        /// <param name="buildOptions">the options of the build creation</param>
        /// <param name="region">target region</param>
        /// <param name="creds">Credentials to be used</param>
        public static async Task<ConcurrentVisualClient> Get(Region region, VisualCredential creds, CreateBuildOptions buildOptions)
        {
            var client = await Instances.GetOrAddAsync(region, async (key) =>
            {
                var client = new ConcurrentVisualClient(key, creds);
                client.Build = await BuildFactory.Get(client.Api, buildOptions);
                return client;
            });
            return client;
        }

        /// <summary>
        /// Close currently open build in all regions.
        ///
        /// This should be invoked after all your test have processed.
        /// <c>Finish</c> should be invoked within <c>[OneTimeTearDown]</c>
        /// </summary>
        public static async Task Finish()
        {
            var keys = Instances.Keys;
            foreach (var key in keys)
            {
                Instances.TryRemove(key, out var client);

                await client.Api.FinishBuild(client.Build.Id);
                client.Dispose();
            }
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="region">the Sauce Labs region to connect to</param>
        /// <param name="creds">the Sauce Labs credentials</param>
        private ConcurrentVisualClient(Region region, VisualCredential creds) : base(region, creds.Username, creds.AccessKey)
        {
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
            options.EnsureTestContextIsPopulated(callerMemberName, PreviousSuiteName);
            PreviousSuiteName = options.SuiteName;
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
                var res = await Api.WebDriverSessionInfo(sessionId, jobId);
                return res.EnsureValidResponse().Result;
            });

            return await VisualCheckBaseAsync(name, options, jobId, sessionId, sessionMetadata.Blob);
        }
    }
}
