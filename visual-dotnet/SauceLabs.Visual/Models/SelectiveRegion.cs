using System;
using System.Collections.Generic;
using OpenQA.Selenium;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual.Models
{
    /// <summary>
    /// SelectiveRegion describe a region where change kind can be filtered.
    /// </summary>
    [Obsolete("WARNING: This API is currently unstable. It may be changed at anytime")]
    public class SelectiveRegion
    {
        public IgnoreRegion? Region { get; set; }
        public IWebElement? Element { get; set; }

        public DiffingOption[]? EnableOnly { get; set; }
        public DiffingOption[]? DisableOnly { get; set; }

        [Obsolete("WARNING: This API is currently unstable. It may be changed at anytime")]
        public SelectiveRegion()
        {
        }

        internal RegionIn ToRegionIn()
        {
            if (Region != null && Element != null)
            {
                throw new VisualClientException("ambiguous selective region. Only one of 'region' or 'element' has to be specified.");
            }
            if (Region == null && Element == null)
            {
                throw new VisualClientException("invalid selective region. one of 'region' or 'element' has to be specified.");
            }

            var diffingOptions = DiffingOptionsInHelper.CreateFromEnableOnlyDisable(EnableOnly, DisableOnly);
            return Region != null ? new RegionIn(Region, diffingOptions) : new RegionIn(Element!, diffingOptions);
        }
    }
}