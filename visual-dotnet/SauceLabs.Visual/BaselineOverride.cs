using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual
{
    /// <summary>
    /// <c>BaselineOverride</c> One or more values from 'SnapshotIn' we should use as an override
    /// when finding a baseline. Enables cross browser / OS snapshot comparison by matching the
    /// values set on the device you'd like to compare against.
    /// </summary>
    public class BaselineOverride
    {
        public Browser? Browser { get; set; }
        public string? BrowserVersion { get; set; }
        public string? Device { get; set; }
        public string? Name { get; set; }
        public OperatingSystem? OperatingSystem { get; set; }
        public string? OperatingSystemVersion { get; set; }
        public string? SuiteName { get; set; }
        public string? TestName { get; set; }

        internal BaselineOverrideIn ToBaselineOverrideIn()
        {
            return new BaselineOverrideIn()
            {
                Browser = Browser,
                BrowserVersion = BrowserVersion,
                Device = Device,
                Name = Name,
                OperatingSystem = OperatingSystem,
                OperatingSystemVersion = OperatingSystemVersion,
                SuiteName = SuiteName,
                TestName = TestName,
            };
        }
    }
}
