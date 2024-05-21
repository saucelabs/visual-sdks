using System;
using System.Collections.Generic;
using SauceLabs.Visual.GraphQL;

namespace SauceLabs.Visual
{
    public class FullPageConfig
    {
        public int? DelayAfterScrollMs { get; set; }
        public bool? DisableCSSAnimation { get; set; }
        public IEnumerable<string>? HideAfterFirstScroll { get; set; }
        public bool? HideScrollBars { get; set; }
        public int? ScrollLimit { get; set; }

        internal FullPageConfigIn ToFullPageConfigIn()
        {
            return new FullPageConfigIn()
            {
                DelayAfterScrollMs = DelayAfterScrollMs,
                DisableCSSAnimation = DisableCSSAnimation,
                HideAfterFirstScroll = HideAfterFirstScroll,
                HideScrollBars = HideScrollBars,
                ScrollLimit = ScrollLimit
            };
        }
    }
}
