using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Models;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual
{
    /// <summary>
    /// <c>BaselineOverride</c> One or more values from 'SnapshotIn' we should use as an override
    /// when finding a baseline. Enables cross browser / OS snapshot comparison by matching the
    /// values set on the device you'd like to compare against.
    /// </summary>
    public class BaselineOverride
    {
        public Option<Browser?> Browser { get; set; }
        public Option<string?> BrowserVersion { get; set; }
        public Option<string?> Device { get; set; }
        public Option<string?> Name { get; set; }
        public Option<OperatingSystem?> OperatingSystem { get; set; }
        public Option<string?> OperatingSystemVersion { get; set; }
        public Option<string?> SuiteName { get; set; }
        public Option<string?> TestName { get; set; }

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
