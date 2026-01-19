using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NUnit.Framework;
using SauceLabs.Visual;
using SauceLabs.Visual.Models;

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
        var serialized = JsonConvert.SerializeObject(overrideIn, new JsonSerializerSettings
        {
        });

        var deserialized = JsonConvert.DeserializeObject(serialized) as JObject;
        Assert.IsTrue(deserialized!.ContainsKey("browser"));
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
}
