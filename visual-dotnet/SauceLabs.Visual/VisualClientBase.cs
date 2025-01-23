using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Polly;
using Polly.Retry;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Models;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual
{
    public abstract class VisualClientBase : IDisposable
    {
        private readonly List<string> _screenshotIds = new List<string>();
        internal readonly VisualApi Api;
        public VisualBuild Build { get; internal set; }

        public bool CaptureDom { get; set; } = false;
        public BaselineOverride? BaselineOverride { get; set; }

        protected string? PreviousSuiteName = null;
        private readonly ResiliencePipeline _retryPipeline;

        internal VisualClientBase(Region region, string username, string accessKey)
        {
            if (StringUtils.IsNullOrEmpty(username) || StringUtils.IsNullOrEmpty(accessKey))
            {
                throw new VisualClientException("Username or Access Key not set");
            }

            Api = new VisualApi(region, username, accessKey);

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

        internal async Task<string> VisualCheckBaseAsync(string name,
            VisualCheckOptions options, string jobId, string sessionId, string? sessionMetadataBlob)
        {
            var ignoredRegions =
                IgnoredRegions.SplitIgnoredRegions(options.Regions, options.IgnoreRegions, options.IgnoreElements);

            FullPageConfigIn? fullPageConfigIn = null;
            if (options.FullPage == true)
            {
                fullPageConfigIn = (options.FullPageConfig ?? new FullPageConfig()).ToFullPageConfigIn();
            }

            var result = (await Api.CreateSnapshotFromWebDriver(new CreateSnapshotFromWebDriverIn(
                buildUuid: Build.Id,
                name: name,
                jobId: jobId,
                diffingMethod: options.DiffingMethod ?? DiffingMethod.Balanced,
                regions: ignoredRegions.RegionsIn,
                ignoredElements: ignoredRegions.ElementsIn,
                sessionId: sessionId,
                sessionMetadata: sessionMetadataBlob ?? "",
                captureDom: options.CaptureDom ?? CaptureDom,
                clipElement: options.ClipElement?.GetElementId(),
                suiteName: options.SuiteName,
                testName: options.TestName,
                fullPageConfig: fullPageConfigIn,
                diffingOptions: options.DiffingOptions?.ToDiffingOptionsIn(),
                baselineOverride: (options.BaselineOverride ?? BaselineOverride)?.ToBaselineOverrideIn()
            ))).EnsureValidResponse();
            result.Result.Diffs.Nodes.ToList().ForEach(d => _screenshotIds.Add(d.Id));
            return result.Result.Id;
        }

        public void Dispose()
        {
            Api.Dispose();
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
