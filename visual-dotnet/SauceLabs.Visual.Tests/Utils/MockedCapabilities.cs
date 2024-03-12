using System.Collections.Generic;
using OpenQA.Selenium;

namespace SauceLabs.Visual.Tests.Utils;

internal class MockedCapabilities : ICapabilities
{
    private readonly Dictionary<string, object> _capabilities;

    public MockedCapabilities(Dictionary<string, object> caps)
    {
        _capabilities = caps;
    }

    public bool HasCapability(string capability)
    {
        return _capabilities.ContainsKey(capability);
    }

    public object GetCapability(string capability)
    {
        return _capabilities[capability];
    }

    public object this[string capabilityName] => _capabilities[capabilityName];
}