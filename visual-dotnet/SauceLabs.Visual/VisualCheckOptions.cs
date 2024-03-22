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

        /// <summary>
        /// <c>SuiteName</c> manually set the SuiteName of the Test.
        /// </summary>
        public string? SuiteName { get; set; }
        /// <summary>
        /// <c>TestName</c> manually set the TestName of the Test.
        /// </summary>
        public string? TestName { get; set; }

        internal bool HasIncompleteTestContext() => string.IsNullOrEmpty(SuiteName) || string.IsNullOrEmpty(TestName);
    }
}