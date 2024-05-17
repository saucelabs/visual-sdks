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
        private int? _scrollLimit;
        public int? ScrollLimit
        {
            get { return _scrollLimit; }
            set
            {
                if (value > 0 && value <= 10)
                {
                    _scrollLimit = value;
                }
                else
                {
                    throw new ArgumentOutOfRangeException(nameof(ScrollLimit), "Value must be between 1 and 10.");
                }
            }
        }

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