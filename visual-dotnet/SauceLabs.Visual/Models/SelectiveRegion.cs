using System;
using System.Collections.Generic;
using OpenQA.Selenium;
using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual.Models
{
    public class SelectiveRegion
    {
        public IgnoreRegion? Region { get; set; }
        public IWebElement? Element { get; set; }

        public DiffingOption[]? EnableOnly { get; set; }
        public DiffingOption[]? Disable { get; set; }

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

            var diffingOptions = DiffingOptionsInHelper.CreateFromEnableOnlyDisable(EnableOnly, Disable);
            return Region != null ? new RegionIn(Region, diffingOptions) : new RegionIn(Element!, diffingOptions);
        }
    }
}