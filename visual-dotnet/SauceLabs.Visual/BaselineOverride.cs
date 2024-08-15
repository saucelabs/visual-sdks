using SauceLabs.Visual.GraphQL;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual
{
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
