using System;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using OpenQA.Selenium;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual
{
    /// <summary>
    /// <c>VisualClient</c> provides an access to Sauce Labs Visual services.
    /// </summary>
    public class VisualClient : VisualClientBase
    {
        private static readonly WebDriverMetadataCache _wdCache = new WebDriverMetadataCache();

        private WebDriverMetadata? _metadata;

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="wd">the instance of the WebDriver session</param>
        public static async Task<VisualClient> Create(WebDriver wd)
        {
            return await Create(wd, Region.FromEnvironment(), EnvVars.Username, EnvVars.AccessKey, new CreateBuildOptions());
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="wd">the instance of the WebDriver session</param>
        /// <param name="buildOptions">the options of the build creation</param>
        public static async Task<VisualClient> Create(WebDriver wd, CreateBuildOptions buildOptions)
        {
            return await Create(wd, Region.FromEnvironment(), EnvVars.Username, EnvVars.AccessKey, buildOptions);
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="wd">the instance of the WebDriver session</param>
        /// <param name="region">the Sauce Labs region to connect to</param>
        public static async Task<VisualClient> Create(WebDriver wd, Region region)
        {
            return await Create(wd, region, EnvVars.Username, EnvVars.AccessKey, new CreateBuildOptions());
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="wd">the instance of the WebDriver session</param>
        /// <param name="region">the Sauce Labs region to connect to</param>
        /// <param name="buildOptions">the options of the build creation</param>
        public static async Task<VisualClient> Create(WebDriver wd, Region region, CreateBuildOptions buildOptions)
        {
            return await Create(wd, region, EnvVars.Username, EnvVars.AccessKey, buildOptions);
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="wd">the instance of the WebDriver session</param>
        /// <param name="region">the Sauce Labs region to connect to</param>
        /// <param name="username">the Sauce Labs username</param>
        /// <param name="accessKey">the Sauce Labs access key</param>
        public static async Task<VisualClient> Create(WebDriver wd, Region region, string username, string accessKey)
        {
            return await Create(wd, region, username, accessKey, new CreateBuildOptions());
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="wd">the instance of the WebDriver session</param>
        /// <param name="region">the Sauce Labs region to connect to</param>
        /// <param name="username">the Sauce Labs username</param>
        /// <param name="accessKey">the Sauce Labs access key</param>
        /// <param name="buildOptions">the options of the build creation</param>
        public static async Task<VisualClient> Create(WebDriver wd, Region region, string username, string accessKey, CreateBuildOptions buildOptions)
        {
            var client = new VisualClient(region, username, accessKey);
            client._metadata = await client.GetMetadata(wd);
            await client.SetupBuild(buildOptions);
            return client;
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        public static async Task<VisualClient> Create()
        {
            return await Create(Region.FromEnvironment(), EnvVars.Username, EnvVars.AccessKey, new CreateBuildOptions());
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="buildOptions">the options of the build creation</param>
        public static async Task<VisualClient> Create(CreateBuildOptions buildOptions)
        {
            return await Create(Region.FromEnvironment(), EnvVars.Username, EnvVars.AccessKey, buildOptions);
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="region">the Sauce Labs region to connect to</param>
        public static async Task<VisualClient> Create(Region region)
        {
            return await Create(region, EnvVars.Username, EnvVars.AccessKey, new CreateBuildOptions());
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="region">the Sauce Labs region to connect to</param>
        /// <param name="buildOptions">the options of the build creation</param>
        public static async Task<VisualClient> Create(Region region, CreateBuildOptions buildOptions)
        {
            return await Create(region, EnvVars.Username, EnvVars.AccessKey, buildOptions);
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="region">the Sauce Labs region to connect to</param>
        /// <param name="username">the Sauce Labs username</param>
        /// <param name="accessKey">the Sauce Labs access key</param>
        public static async Task<VisualClient> Create(Region region, string username, string accessKey)
        {
            return await Create(region, username, accessKey, new CreateBuildOptions());
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="region">the Sauce Labs region to connect to</param>
        /// <param name="username">the Sauce Labs username</param>
        /// <param name="accessKey">the Sauce Labs access key</param>
        /// <param name="buildOptions">the options of the build creation</param>
        public static async Task<VisualClient> Create(Region region, string username, string accessKey, CreateBuildOptions buildOptions)
        {
            var client = new VisualClient(region, username, accessKey);
            await client.SetupBuild(buildOptions);
            return client;
        }

        private async Task SetupBuild(CreateBuildOptions buildOptions)
        {
            Build = await BuildFactory.Get(Api, buildOptions);
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="wd">the instance of the WebDriver session</param>
        /// <param name="region">the Sauce Labs region to connect to</param>
        /// <param name="username">the Sauce Labs username</param>
        /// <param name="accessKey">the Sauce Labs access key</param>
        private VisualClient(Region region, string username, string accessKey) : base(region, username, accessKey)
        {
        }

        /// <summary>
        /// <c>FinishBuild</c> finishes a build
        /// </summary>
        /// <param name="build">the build to finish</param>
        private async Task FinishBuild(VisualBuild build)
        {
            (await Api.FinishBuild(build.Id)).EnsureValidResponse();
        }

        /// <summary>
        /// <c>VisualCheck</c> captures a screenshot and queue it for processing.
        /// </summary>
        /// <param name="name">the name of the screenshot</param>
        /// <param name="options">the configuration for the screenshot capture and comparison</param>
        /// <param name="callerMemberName">the member name of the caller (automated) </param>
        /// <returns></returns>
        public Task<string> VisualCheck(string name, VisualCheckOptions? options = null,
            [CallerMemberName] string callerMemberName = "")
        {
            if (_metadata == null)
            {
                throw new InvalidOperationException("VisualClient has not been initialized with a WebDriver instance. Please use the `VisualCheck` method accepting a WebDriver instance.");
            }

            options ??= new VisualCheckOptions();
            options.EnsureTestContextIsPopulated(callerMemberName, PreviousSuiteName);
            PreviousSuiteName = options.SuiteName;

            return VisualCheckAsync(name, options, _metadata);
        }

        /// <summary>
        /// <c>VisualCheck</c> captures a screenshot and queue it for processing.
        /// </summary>
        /// <param name="wd">the instance of the WebDriver session</param>
        /// <param name="name">the name of the screenshot</param>
        /// <param name="options">the configuration for the screenshot capture and comparison</param>
        /// <param name="callerMemberName">the member name of the caller (automated) </param>
        /// <returns></returns>
        public async Task<string> VisualCheck(WebDriver wd, string name, VisualCheckOptions? options = null,
            [CallerMemberName] string callerMemberName = "")
        {
            options ??= new VisualCheckOptions();
            options.EnsureTestContextIsPopulated(callerMemberName, PreviousSuiteName);
            PreviousSuiteName = options.SuiteName;

            var metadata = await GetMetadata(wd);
            return await VisualCheckAsync(name, options, metadata);
        }

        private async Task<string> VisualCheckAsync(string name, VisualCheckOptions options, WebDriverMetadata webDriverMetadata)
        {
            return await VisualCheckBaseAsync(name, options, webDriverMetadata);
        }

        private async Task<WebDriverMetadata> GetMetadata(WebDriver wd)
        {
            var sessionId = wd.SessionId.ToString();
            var jobId = wd.Capabilities.HasCapability("jobUuid") ? wd.Capabilities.GetCapability("jobUuid").ToString() : sessionId;
            return await _wdCache.GetMetadata(Api, sessionId, jobId);
        }

        /// <summary>
        /// <c>Cleanup</c> set a correct status to the build. No action should be made after calling <c>Cleanup</c>.
        /// </summary>
        public async Task Cleanup()
        {
            await BuildFactory.Close(Build);
        }

        /// <summary>
        /// <c>Finish</c> ensures that all known build are closed. No action should be made after calling <c>Finish</c>.
        /// </summary>
        public static async Task Finish()
        {
            await BuildFactory.CloseBuilds();
        }
    }
}
