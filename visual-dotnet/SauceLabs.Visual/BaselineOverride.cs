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
        private Browser? _browser;
        private bool _browserSet = false;
        public Browser? Browser
        {
            get => _browser;
            set
            {
                _browser = value;
                _browserSet = true;
            }
        }
        public void UnsetBrowser()
        {
            _browser = null;
            _browserSet = false;
        }

        private string? _browserVersion;
        private bool _browserVersionSet = false;
        public string? BrowserVersion
        {
            get => _browserVersion;
            set
            {
                _browserVersion = value;
                _browserVersionSet = true;
            }
        }
        public void UnsetBrowserVersion()
        {
            _browserVersion = null;
            _browserVersionSet = false;
        }

        private string? _device;
        private bool _deviceSet = false;
        public string? Device
        {
            get => _device;
            set
            {
                _device = value;
                _deviceSet = true;
            }
        }
        public void UnsetDevice()
        {
            _device = null;
            _deviceSet = false;
        }

        private string? _name;
        private bool _nameSet = false;
        public string? Name
        {
            get => _name;
            set
            {
                _name = value;
                _nameSet = true;
            }
        }

        public void UnsetName()
        {
            _name = null;
            _nameSet = false;
        }
        private OperatingSystem? _operatingSystem;
        private bool _operatingSystemSet = false;
        public OperatingSystem? OperatingSystem
        {
            get => _operatingSystem;
            set
            {
                _operatingSystem = value;
                _operatingSystemSet = true;
            }
        }
        public void UnsetOperatingSystem()
        {
            _operatingSystem = null;
            _operatingSystemSet = false;
        }

        private string? _operatingSystemVersion;
        private bool _operatingSystemVersionSet = false;
        public string? OperatingSystemVersion
        {
            get => _operatingSystemVersion;
            set
            {
                _operatingSystemVersion = value;
                _operatingSystemVersionSet = true;
            }
        }

        public void UnsetOperatingSystemVersion()
        {
            _operatingSystemVersion = null;
            _operatingSystemVersionSet = false;
        }

        private string? _suiteName;
        private bool _suiteNameSet = false;
        public string? SuiteName
        {
            get => _suiteName;
            set
            {
                _suiteName = value;
                _suiteNameSet = true;
            }
        }

        public void UnsetSuiteName()
        {
            _suiteName = null;
            _suiteNameSet = false;
        }

        private string? _testName;
        private bool _testNameSet = false;
        public string? TestName
        {
            get => _testName;
            set
            {
                _testName = value;
                _testNameSet = true;
            }
        }
        public void UnsetTestName()
        {
            _testName = null;
            _testNameSet = false;
        }

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
