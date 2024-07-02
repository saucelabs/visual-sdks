using System.Collections.Generic;
using System.Linq;
using OpenQA.Selenium;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual.Utils
{
    internal class IgnoredRegions
    {
        internal RegionIn[] RegionsIn;
        internal ElementIn[] ElementsIn;


        internal static IgnoredRegions SplitIgnoredRegions(SelectiveRegion[]? regions, IgnoreRegion[]? ignoreRegions, IWebElement[]? ignoreElements)
        {
            var emptyRegions = regions?.Any(r => r.Region == null && r.Element == null);
            if (emptyRegions != null && emptyRegions != false)
            {
                throw new VisualClientException("Some ignore regions have Element nor Region");
            }

            var ignoredRegions = new List<RegionIn>();
            ignoredRegions.AddRange(ignoreRegions?.Select(r => new RegionIn(r)) ?? new List<RegionIn>());
            ignoredRegions.AddRange(regions?.Where(r => r.Region != null).Select(r => r.ToRegionIn()) ?? new List<RegionIn>());

            var ignoredElements = new List<ElementIn>();
            ignoredElements.AddRange(ignoreElements?.Select(elem => new ElementIn(elem)) ?? new List<ElementIn>());
            ignoredElements.AddRange(regions?.Where(r => r.Element != null).Select(r => r.ToElementIn()) ?? new List<ElementIn>());

            return new IgnoredRegions { RegionsIn = ignoredRegions.ToArray(), ElementsIn = ignoredElements.ToArray() };
        }
    }
}