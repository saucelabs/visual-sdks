using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Models;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual
{
    public abstract class AbstractVisualClient
    {
        protected readonly List<string> ScreenshotIds = new List<string>();
        public bool CaptureDom { get; set; } = false;
        public BaselineOverride? BaselineOverride { get; set; }

        internal async Task<string> VisualCheckBaseAsync(VisualApi api, VisualBuild build, string name,
            VisualCheckOptions options, string jobId, string sessionId, string? sessionMetadataBlob)
        {
            var ignoredRegions =
                IgnoredRegions.SplitIgnoredRegions(options.Regions, options.IgnoreRegions, options.IgnoreElements);

            FullPageConfigIn? fullPageConfigIn = null;
            if (options.FullPage == true)
            {
                fullPageConfigIn = (options.FullPageConfig ?? new FullPageConfig()).ToFullPageConfigIn();
            }

            var result = (await api.CreateSnapshotFromWebDriver(new CreateSnapshotFromWebDriverIn(
                buildUuid: build.Id,
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
            result.Result.Diffs.Nodes.ToList().ForEach(d => ScreenshotIds.Add(d.Id));
            return result.Result.Id;
        }
    }
}