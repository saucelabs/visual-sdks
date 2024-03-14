using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AnyRetry;
using AnyRetry.Math;
using OpenQA.Selenium;
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
            _api = new VisualApi<WebDriver>(wd, region, username, accessKey);
            _sessionId = wd.SessionId.ToString();
            _jobId = wd.Capabilities.HasCapability("jobUuid") ? wd.Capabilities.GetCapability("jobUuid").ToString() : _sessionId;
            var response = _api.WebDriverSessionInfo(_jobId, _sessionId).Result;
            var metadata = response.EnsureValidResponse();
            _sessionMetadataBlob = metadata.Result.Blob;

            var createBuildResponse = CreateBuild(buildOptions).Result;
            Build = new VisualBuild(createBuildResponse.Id, createBuildResponse.Url);
            _externalBuild = false;
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
            var policyOptions = new RetryPolicyOptions
            {
                EasingFunction = EasingFunction.ExponentialEaseOut,
                MaxRetryInterval = TimeSpan.FromSeconds(5),
                MaxRetrySteps = 10
            };
            var result = await Retry.Do(async () => await FetchVisualResults(Build.Id),
                retryInterval: TimeSpan.FromMilliseconds(100),
                retryLimit: 10,
                retryPolicy: RetryPolicy.ExponentialBackoff,
                retryPolicyOptions: policyOptions,
                onFailure: null,
                mustReturnTrueBeforeFail: null,
                exceptionTypes: typeof(VisualClientException)
                );
            if (result == null)
            {
                throw new VisualClientException("diff results were not available in time");
            }
            return result;
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