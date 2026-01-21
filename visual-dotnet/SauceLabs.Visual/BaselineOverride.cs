using SauceLabs.Visual.CodeGenerators;
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
    public partial class BaselineOverride
    {
        [ExplicitValueSet]
        private Browser? _browser;
        [ExplicitValueSet]
        private string? _browserVersion;
        [ExplicitValueSet]
        private string? _device;
        [ExplicitValueSet]
        private string? _name;
        [ExplicitValueSet]
        private OperatingSystem? _operatingSystem;
        [ExplicitValueSet]
        private string? _operatingSystemVersion;
        [ExplicitValueSet]
        private string? _suiteName;
        [ExplicitValueSet]
        private string? _testName;

        internal BaselineOverrideIn ToBaselineOverrideIn()
        {
            return new BaselineOverrideIn()
            {
                Browser = _browserSet ? JsonUndefined.Value(Browser) : JsonUndefined.Undefined<Browser?>(),
                BrowserVersion = _browserVersionSet ? JsonUndefined.Value(BrowserVersion) : JsonUndefined.Undefined<string?>(),
                Device = _deviceSet ? JsonUndefined.Value(Device) : JsonUndefined.Undefined<string?>(),
                Name = _nameSet ? JsonUndefined.Value(Name) : JsonUndefined.Undefined<string?>(),
                OperatingSystem = _operatingSystemSet ? JsonUndefined.Value(OperatingSystem) : JsonUndefined.Undefined<OperatingSystem?>(),
                OperatingSystemVersion = _operatingSystemVersionSet ? JsonUndefined.Value(OperatingSystemVersion) : JsonUndefined.Undefined<string?>(),
                SuiteName = _suiteNameSet ? JsonUndefined.Value(SuiteName) : JsonUndefined.Undefined<string?>(),
                TestName = _testNameSet ? JsonUndefined.Value(TestName) : JsonUndefined.Undefined<string?>(),
            };
        }
    }
}
