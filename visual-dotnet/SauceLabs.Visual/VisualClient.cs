using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using OpenQA.Selenium;
using Polly;
using Polly.Retry;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Models;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual
{
    /// <summary>
    /// <c>VisualClient</c> provides an access to Sauce Labs Visual services.
    /// </summary>
    public class VisualClient : AbstractVisualClient
    {
        private readonly string _sessionId;
        private readonly string _jobId;
        private string? _sessionMetadataBlob;
        public VisualBuild Build { get; private set; }
        private readonly ResiliencePipeline _retryPipeline;

        private string? _previousSuiteName = null;

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
            var client = new VisualClient(wd, region, username, accessKey);
            await client.SetupBuild(buildOptions);
            return client;
        }

        private async Task SetupBuild(CreateBuildOptions buildOptions)
        {
            var response = await Api.WebDriverSessionInfo(_jobId, _sessionId);
            var metadata = response.EnsureValidResponse();
            _sessionMetadataBlob = metadata.Result.Blob;

            Build = await BuildFactory.Get(Api, buildOptions);
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="wd">the instance of the WebDriver session</param>
        /// <param name="region">the Sauce Labs region to connect to</param>
        /// <param name="username">the Sauce Labs username</param>
        /// <param name="accessKey">the Sauce Labs access key</param>
        private VisualClient(WebDriver wd, Region region, string username, string accessKey) : base(region, username, accessKey)
        {
            if (StringUtils.IsNullOrEmpty(username) || StringUtils.IsNullOrEmpty(accessKey))
            {
                throw new VisualClientException("Username or Access Key not set");
            }

            _sessionId = wd.SessionId.ToString();
            _jobId = wd.Capabilities.HasCapability("jobUuid") ? wd.Capabilities.GetCapability("jobUuid").ToString() : _sessionId;

            _retryPipeline = new ResiliencePipelineBuilder()
                .AddRetry(new RetryStrategyOptions()
                {
                    Name = "VisualRetryPolicy",
                    Delay = TimeSpan.FromSeconds(1),
                    MaxRetryAttempts = 10
                })
                .AddTimeout(TimeSpan.FromSeconds(15))
                .Build();
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
            options ??= new VisualCheckOptions();
            options.EnsureTestContextIsPopulated(callerMemberName, _previousSuiteName);
            _previousSuiteName = options.SuiteName;
            return VisualCheckAsync(name, options);
        }

        private async Task<string> VisualCheckAsync(string name, VisualCheckOptions options)
        {
            return await VisualCheckBaseAsync(Api, Build, name, options, _jobId, _sessionId, _sessionMetadataBlob);
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

        /// <summary>
        /// <c>VisualResults</c> returns the results of screenshot comparison.
        /// </summary>
        /// <returns>a dictionary containing <c>DiffStatus</c> and the number of screenshot in that status.</returns>
        /// <exception cref="VisualClientException"></exception>
        public async Task<Dictionary<DiffStatus, int>> VisualResults()
        {
            return await _retryPipeline.ExecuteAsync(async token => await FetchVisualResults(Build.Id));
        }

        private async Task<Dictionary<DiffStatus, int>> FetchVisualResults(string buildId)
        {
            var dict = new Dictionary<DiffStatus, int>() {
                { DiffStatus.Approved, 0 },
                { DiffStatus.Equal, 0 },
                { DiffStatus.Unapproved, 0 },
                { DiffStatus.Errored, 0 },
                { DiffStatus.Queued, 0 },
                { DiffStatus.Rejected, 0 }
            };

            var result = (await Api.DiffForTestResult(buildId)).EnsureValidResponse();
            result.Result.Nodes
                .Where(n => ScreenshotIds.Contains(n.Id))
                .Aggregate(dict, (counts, node) =>
                {
                    counts[node.Status] += 1;
                    return counts;
                });

            if (dict[DiffStatus.Queued] > 0)
            {
                throw new VisualClientException("Some diffs are not ready");
            }

            return dict;
        }
    }
}