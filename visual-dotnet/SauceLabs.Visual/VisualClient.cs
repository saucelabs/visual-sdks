using System;
using System.Collections.Generic;
using System.Linq;
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
    public class VisualClient : IDisposable
    {
        private readonly VisualApi<WebDriver> _api;
        private readonly string _sessionId;
        private readonly string _jobId;
        private readonly string _sessionMetadataBlob;
        private readonly List<string> _screenshotIds = new List<string>();
        public VisualBuild Build { get; }
        private readonly bool _externalBuild;
        public bool CaptureDom { get; set; } = false;
        private readonly ResiliencePipeline _retryPipeline;

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="wd">the instance of the WebDriver session</param>
        /// <param name="region">the Sauce Labs region to connect to</param>
        public VisualClient(WebDriver wd, Region region) : this(wd, region, Environment.GetEnvironmentVariable("SAUCE_USERNAME"), Environment.GetEnvironmentVariable("SAUCE_ACCESS_KEY"))
        {
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="wd">the instance of the WebDriver session</param>
        /// <param name="region">the Sauce Labs region to connect to</param>
        /// <param name="buildOptions">the options of the build creation</param>
        public VisualClient(WebDriver wd, Region region, CreateBuildOptions buildOptions) : this(wd, region, Environment.GetEnvironmentVariable("SAUCE_USERNAME"), Environment.GetEnvironmentVariable("SAUCE_ACCESS_KEY"), buildOptions)
        {
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="wd">the instance of the WebDriver session</param>
        /// <param name="region">the Sauce Labs region to connect to</param>
        /// <param name="username">the Sauce Labs username</param>
        /// <param name="accessKey">the Sauce Labs access key</param>
        public VisualClient(WebDriver wd, Region region, string username, string accessKey) : this(wd, region, username, accessKey, new CreateBuildOptions())
        {
        }

        /// <summary>
        /// Creates a new instance of <c>VisualClient</c>
        /// </summary>
        /// <param name="wd">the instance of the WebDriver session</param>
        /// <param name="region">the Sauce Labs region to connect to</param>
        /// <param name="username">the Sauce Labs username</param>
        /// <param name="accessKey">the Sauce Labs access key</param>
        /// <param name="buildOptions">the options of the build creation</param>
        public VisualClient(WebDriver wd, Region region, string username, string accessKey, CreateBuildOptions buildOptions)
        {
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(accessKey))
            {
                throw new VisualClientException("Username or Access Key not set");
            }

            _api = new VisualApi<WebDriver>(wd, region, username, accessKey);
            _sessionId = wd.SessionId.ToString();
            _jobId = wd.Capabilities.HasCapability("jobUuid") ? wd.Capabilities.GetCapability("jobUuid").ToString() : _sessionId;
            var response = _api.WebDriverSessionInfo(_jobId, _sessionId).Result;
            var metadata = response.EnsureValidResponse();
            _sessionMetadataBlob = metadata.Result.Blob;

            var build = GetEffectiveBuild(Environment.GetEnvironmentVariable("SAUCE_VISUAL_BUILD_ID"), Environment.GetEnvironmentVariable("SAUCE_VISUAL_CUSTOM_ID")).Result;
            if (build != null)
            {
                Build = build;
                _externalBuild = true;
            }
            else
            {
                var createBuildResponse = CreateBuild(buildOptions).Result;
                Build = new VisualBuild(createBuildResponse.Id, createBuildResponse.Url);
                _externalBuild = false;
            }

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
        /// <c>FindBuildById</c> returns the build identified by <c>buildId</c>
        /// </summary>
        /// <param name="buildId"></param>
        /// <returns>the matching build</returns>
        /// <exception cref="VisualClientException">when build is not existing or has an invalid state</exception>
        private async Task<VisualBuild> FindBuildById(string buildId)
        {
            var response = await _api.Build(buildId);
            if (response.Data?.Result == null)
            {
                throw new VisualClientException($@"build {buildId} was not found");
            }

            var build = response.Data.Result;
            if (build.Mode != BuildMode.Running)
            {
                throw new VisualClientException($"build {build.Id} is not RUNNING");
            }
            return new VisualBuild(build.Id, build.Url);
        }

        /// <summary>
        /// <c>TryFindBuildByCustomId</c> returns the build identified by <c>customId</c> or null if not found
        /// </summary>
        /// <param name="customId"></param>
        /// <returns>the matching build or null</returns>
        /// <exception cref="VisualClientException">when build has an invalid state</exception>
        private async Task<VisualBuild?> TryFindBuildByCustomId(string customId)
        {
            var response = await _api.BuildByCustomId(customId);
            if (response.Data?.Result == null)
            {
                return null;
            }

            var build = response.Data.Result;
            if (build.Mode != BuildMode.Running)
            {
                throw new VisualClientException($"build {build.Id} is not RUNNING");
            }
            return new VisualBuild(build.Id, build.Url);
        }

        /// <summary>
        /// <c>GetEffectiveBuild</c> tries to find the build matching the criterion provided by the user.
        /// </summary>
        /// <param name="buildId"></param>
        /// <param name="customId"></param>
        /// <returns></returns>
        private async Task<VisualBuild?> GetEffectiveBuild(string? buildId, string? customId)
        {
            if (!string.IsNullOrEmpty(buildId))
            {
                return await FindBuildById(buildId);
            }

            if (!string.IsNullOrEmpty(customId))
            {
                return await TryFindBuildByCustomId(customId);
            }
            return null;
        }

        /// <summary>
        /// <c>CreateBuild</c> creates a new Visual build.
        /// </summary>
        /// <param name="options">the options for the build creation</param>
        /// <returns>a <c>VisualBuild</c> instance</returns>
        private async Task<VisualBuild> CreateBuild(CreateBuildOptions? options = null)
        {
            var result = (await _api.CreateBuild(new CreateBuildIn
            {
                Name = options?.Name,
                Project = options?.Project,
                Branch = options?.Branch,
                CustomId = options?.CustomId,
                DefaultBranch = options?.DefaultBranch,
            })).EnsureValidResponse();
            return new VisualBuild(result.Result.Id, result.Result.Url);
        }

        /// <summary>
        /// <c>FinishBuild</c> finishes a build
        /// </summary>
        /// <param name="build">the build to finish</param>
        private async Task FinishBuild(VisualBuild build)
        {
            (await _api.FinishBuild(build.Id)).EnsureValidResponse();
        }

        /// <summary>
        /// <c>VisualCheck</c> captures a screenshot and queue it for processing.
        /// </summary>
        /// <param name="build">the build that will contain the screenshot</param>
        /// <param name="name">the name of the screenshot</param>
        /// <param name="options">the configuration for the screenshot capture and comparison</param>
        /// <returns></returns>
        public async Task<string> VisualCheck(string name, VisualCheckOptions? options = null)
        {
            var ignored = new List<RegionIn>();
            ignored.AddRange(options?.IgnoreRegions?.Select(r => new RegionIn(r)) ?? new List<RegionIn>());
            ignored.AddRange(options?.IgnoreElements?.Select(r => new RegionIn(r)) ?? new List<RegionIn>());

            var result = (await _api.CreateSnapshotFromWebDriver(new CreateSnapshotFromWebDriverIn(
                buildUuid: Build.Id,
                name: name,
                jobId: _jobId,
                diffingMethod: options?.DiffingMethod ?? DiffingMethod.Simple,
                regions: ignored.ToArray(),
                sessionId: _sessionId,
                sessionMetadata: _sessionMetadataBlob,
                captureDom: options?.CaptureDom ?? CaptureDom))).EnsureValidResponse();
            result.Result.Diffs.Nodes.ToList().ForEach(d => _screenshotIds.Add(d.Id));
            return result.Result.Id;
        }

        /// <summary>
        /// <c>Cleanup</c> set a correct status to the build. No action should be made after that calling <c>Cleanup</c>.
        /// </summary>
        public async Task Cleanup()
        {
            if (!_externalBuild)
            {
                await FinishBuild(Build);
            }
        }

        public void Dispose()
        {
            _api.Dispose();
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

            var result = (await _api.DiffForTestResult(buildId)).EnsureValidResponse();
            result.Result.Nodes
                .Where(n => _screenshotIds.Contains(n.Id))
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