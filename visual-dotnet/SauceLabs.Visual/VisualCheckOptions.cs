using OpenQA.Selenium;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual
{

    /// <summary>
    /// <c>VisualCheckOptions</c> represents the options that can be used when running a Visual Check.
    /// </summary>
    public class VisualCheckOptions
    {
        public DiffingMethod? DiffingMethod { get; set; }
        public IgnoreRegion[]? IgnoreRegions { get; set; }
        public IWebElement[]? IgnoreElements { get; set; }
        public bool? CaptureDom { get; set; }
        public string? ClipSelector { get; set; }

        public string? ClassName { get; set; }
        public string? TestName { get; set; }
    }
}