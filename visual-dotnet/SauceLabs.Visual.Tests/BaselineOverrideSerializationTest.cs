using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual.Tests;

public class BaselineOverrideSerializationTest
{
    [Test]
    public async Task BaselineOverride_Serialize_IncludeOnlySetValues()
    {
        var @override = new BaselineOverride
        {
            Browser = Browser.Chrome,
            Device = "abc",
        };

        var overrideIn = @override.ToBaselineOverrideIn();
        var serialized = JsonConvert.SerializeObject(overrideIn);

        var deserialized = JsonConvert.DeserializeObject(serialized) as JObject;
        Assert.AreEqual(deserialized!.Count, 2);
        Assert.IsTrue(deserialized.ContainsKey("browser"));
        Assert.IsTrue(deserialized.ContainsKey("device"));
        Assert.IsFalse(deserialized.ContainsKey("name"));
    }

    [Test]
    public async Task BaselineOverride_Serialize_SerializeExplicitlySetNullValues()
    {
        var @override = new BaselineOverride
        {
            TestName = null
        };

        var overrideIn = @override.ToBaselineOverrideIn();
        var serialized = JsonConvert.SerializeObject(overrideIn);

        var deserialized = JsonConvert.DeserializeObject(serialized) as JObject;
        Assert.IsTrue(deserialized!.ContainsKey("testName"));
        Assert.AreEqual(deserialized["testName"]!.Type, JTokenType.Null);
    }

    [Test]
    public async Task BaselineOverride_Serialize_ExpectSameValues()
    {
        var @override = new BaselineOverride
        {
            TestName = "test",
            Browser = Browser.Chrome,
            BrowserVersion = "1.2.3",
            Device = "my device",
            Name = "foo",
            OperatingSystem = OperatingSystem.Linux,
            OperatingSystemVersion = "4.5.2",
            SuiteName = "my suite name"
        };


        var overrideIn = @override.ToBaselineOverrideIn();
        var serialized = JsonConvert.SerializeObject(overrideIn);

        var deserialized = JsonConvert.DeserializeObject(serialized) as JObject;
        Assert.AreEqual(deserialized["testName"].Value<string>(), @override.TestName);
        Assert.AreEqual(deserialized["browser"].Value<int>(), (int)@override.Browser);
        Assert.AreEqual(deserialized["browserVersion"].Value<string>(), @override.BrowserVersion);
        Assert.AreEqual(deserialized["device"].Value<string>(), @override.Device);
        Assert.AreEqual(deserialized["name"].Value<string>(), @override.Name);
        Assert.AreEqual(deserialized["operatingSystem"].Value<int>(), (int)@override.OperatingSystem);
        Assert.AreEqual(deserialized["operatingSystemVersion"].Value<string>(), @override.OperatingSystemVersion);
        Assert.AreEqual(deserialized["suiteName"].Value<string>(), @override.SuiteName);
    }

    [Test]
    public async Task BaselineOverride_Serialize_ExpectNullValues()
    {
        var @override = new BaselineOverride
        {
            TestName = null,
            Browser = null,
            BrowserVersion = null,
            Device = null,
            Name = null,
            OperatingSystem = null,
            OperatingSystemVersion = null,
            SuiteName = null
        };

        var overrideIn = @override.ToBaselineOverrideIn();
        var serialized = JsonConvert.SerializeObject(overrideIn);

        var deserialized = JsonConvert.DeserializeObject(serialized) as JObject;
        Assert.AreEqual(deserialized["testName"].Value<string?>(), null);
        Assert.AreEqual(deserialized["browser"].Value<int?>(), null);
        Assert.AreEqual(deserialized["browserVersion"].Value<string?>(), null);
        Assert.AreEqual(deserialized["device"].Value<string?>(), null);
        Assert.AreEqual(deserialized["name"].Value<string?>(), null);
        Assert.AreEqual(deserialized["operatingSystem"].Value<int?>(), null);
        Assert.AreEqual(deserialized["operatingSystemVersion"].Value<string?>(), null);
        Assert.AreEqual(deserialized["suiteName"].Value<string?>(), null);
    }

    [Test]
    public async Task BaselineOverride_Serialize_ExpectNoValues()
    {
        var @override = new BaselineOverride
        {
        };

        var overrideIn = @override.ToBaselineOverrideIn();
        var serialized = JsonConvert.SerializeObject(overrideIn);

        var deserialized = JsonConvert.DeserializeObject(serialized) as JObject;
        Assert.AreEqual(deserialized["testName"], null);
        Assert.AreEqual(deserialized["browser"], null);
        Assert.AreEqual(deserialized["browserVersion"], null);
        Assert.AreEqual(deserialized["device"], null);
        Assert.AreEqual(deserialized["name"], null);
        Assert.AreEqual(deserialized["operatingSystem"], null);
        Assert.AreEqual(deserialized["operatingSystemVersion"], null);
        Assert.AreEqual(deserialized["suiteName"], null);
    }
}

