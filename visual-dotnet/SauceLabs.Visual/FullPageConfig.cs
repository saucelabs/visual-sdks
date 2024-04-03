using System.Collections;
using SauceLabs.Visual.GraphQL;

namespace SauceLabs.Visual
{
    public class FullPageConfig
    {
        public int? DelayAfterScrollMs { get; set; }
        public IEnumerable? HideAfterFirstScroll { get; set; }

        internal FullPageConfigIn ToFullPageConfigIn()
        {
            return new FullPageConfigIn()
            {
                DelayAfterScrollMs = DelayAfterScrollMs,
                HideAfterFirstScroll = HideAfterFirstScroll
            };
        }
    }
}