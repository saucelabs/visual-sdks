using System.Diagnostics;
using System.Linq;
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
        public bool? FullPage { get; set; }
        public FullPageConfig? FullPageConfig { get; set; }
        public string? ClipSelector { get; set; }
        public IWebElement? ClipElement { get; set; }

        /// <summary>
        /// <c>DiffingOptions</c> set which kind of changes should be considered.
        /// </summary>
        public VisualCheckDiffingOptions? DiffingOptions { get; set; }

        /// <summary>
        /// <c>Regions</c> allows to specify what kind of checks needs to be done in a specific region.
        /// </summary>
        public SelectiveRegion[]? Regions { get; set; }

        /// <summary>
        /// <c>SuiteName</c> manually set the SuiteName of the Test.
        /// </summary>
        public string? SuiteName { get; set; }
        /// <summary>
        /// <c>TestName</c> manually set the TestName of the Test.
        /// </summary>
        public string? TestName { get; set; }

        /// <summary>
        /// <c>BaselineOverride</c> override the baseline matching behavior for the test.
        /// </summary>
        public BaselineOverride? BaselineOverride { get; set; }

        private bool HasCompleteTestContext()
        {
            return string.IsNullOrEmpty(SuiteName) & !string.IsNullOrEmpty(TestName);
        }

        internal void EnsureTestContextIsPopulated(string callerMemberName, string? previousSuiteName)
        {
            if (string.IsNullOrEmpty(callerMemberName) || HasCompleteTestContext())
            {
                return;
            }

            var stack = new StackTrace();
            var frame = stack.GetFrames()?.FirstOrDefault(f => f.GetMethod().Name == callerMemberName);
            SuiteName ??= frame?.GetMethod().DeclaringType?.FullName ?? previousSuiteName;
            TestName ??= callerMemberName;
        }
    }
}