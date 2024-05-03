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
        internal Region? Region { get; }
        internal IWebElement? Element { get; }

        internal DiffingOption? EnableOnly { get; }
        internal DiffingOption? DisableOnly { get; }

        private SelectiveRegion(IWebElement element, DiffingOption? enableOnly, DiffingOption? disableOnly)
        {
            Element = element;
            EnableOnly = enableOnly;
            DisableOnly = disableOnly;
        }

        private SelectiveRegion(Region region, DiffingOption? enableOnly, DiffingOption? disableOnly)
        {
            Region = region;
            EnableOnly = enableOnly;
            DisableOnly = disableOnly;
        }

        [Obsolete("WARNING: This API is currently unstable. It may be changed at anytime")]
        public static SelectiveRegion EnabledRegion(IWebElement element)
        {
            return new SelectiveRegion(element, null, null);
        }

        [Obsolete("WARNING: This API is currently unstable. It may be changed at anytime")]
        public static SelectiveRegion EnabledRegion(IWebElement element, DiffingOption flags)
        {
            return new SelectiveRegion(element, flags, null);
        }

        [Obsolete("WARNING: This API is currently unstable. It may be changed at anytime")]
        public static SelectiveRegion EnabledRegion(Region region)
        {
            return new SelectiveRegion(region, DiffingOption.None, null);
        }

        [Obsolete("WARNING: This API is currently unstable. It may be changed at anytime")]
        public static SelectiveRegion EnabledRegion(Region region, DiffingOption flags)
        {
            return new SelectiveRegion(region, flags, null);
        }

        [Obsolete("WARNING: This API is currently unstable. It may be changed at anytime")]
        public static SelectiveRegion DisabledRegion(IWebElement element)
        {
            return new SelectiveRegion(element, null, DiffingOption.None);
        }

        [Obsolete("WARNING: This API is currently unstable. It may be changed at anytime")]
        public static SelectiveRegion DisabledRegion(IWebElement element, DiffingOption flags)
        {
            return new SelectiveRegion(element, null, flags);
        }

        [Obsolete("WARNING: This API is currently unstable. It may be changed at anytime")]
        public static SelectiveRegion DisabledRegion(Region region)
        {
            return new SelectiveRegion(region, null, DiffingOption.None);
        }

        [Obsolete("WARNING: This API is currently unstable. It may be changed at anytime")]
        public static SelectiveRegion DisabledRegion(Region region, DiffingOption flags)
        {
            return new SelectiveRegion(region, null, flags);
        }

        internal RegionIn ToRegionIn()
        {
            var diffingOptions = DiffingOptionsInHelper.CreateFromEnableOnlyDisable(EnableOnly, DisableOnly);
            return Region != null ? new RegionIn(Region, diffingOptions) : new RegionIn(Element!, diffingOptions);
        }
    }
}