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

        public static SelectiveRegion EnabledFor(IWebElement element)
        {
            return new SelectiveRegion(element, null, null);
        }

        public static SelectiveRegion EnabledFor(IWebElement element, DiffingOption flags)
        {
            return new SelectiveRegion(element, flags, null);
        }

        public static SelectiveRegion EnabledFor(Region region)
        {
            return new SelectiveRegion(region, DiffingOption.None, null);
        }

        public static SelectiveRegion EnabledFor(Region region, DiffingOption flags)
        {
            return new SelectiveRegion(region, flags, null);
        }

        public static SelectiveRegion DisabledFor(IWebElement element)
        {
            return new SelectiveRegion(element, null, DiffingOption.None);
        }

        public static SelectiveRegion DisabledFor(IWebElement element, DiffingOption flags)
        {
            return new SelectiveRegion(element, null, flags);
        }

        public static SelectiveRegion DisabledFor(Region region)
        {
            return new SelectiveRegion(region, null, DiffingOption.None);
        }

        public static SelectiveRegion DisabledFor(Region region, DiffingOption flags)
        {
            return new SelectiveRegion(region, null, flags);
        }

        internal RegionIn ToRegionIn()
        {
            var diffingOptions = DiffingOptionsInHelper.CreateFromEnableOnlyDisable(EnableOnly, DisableOnly);
            if (Region != null)
            {
                return new RegionIn(Region, diffingOptions);
            }

            if (Element != null)
            {
                return new RegionIn(Element, diffingOptions);
            }

            throw new VisualClientException("No Region has been passed");
        }


        internal ElementIn ToElementIn()
        {
            var diffingOptions = DiffingOptionsInHelper.CreateFromEnableOnlyDisable(EnableOnly, DisableOnly);

            if (Element != null)
            {
                return new ElementIn(Element, null, diffingOptions);
            }

            throw new VisualClientException("No Element has been passed");
        }
    }
}