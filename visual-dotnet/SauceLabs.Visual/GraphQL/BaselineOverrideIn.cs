using System.Collections.Generic;
using Newtonsoft.Json;
using SauceLabs.Visual.Models;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual.GraphQL
{
    [JsonConverter(typeof(BaselineOverrideInJsonConverter))]
    internal class BaselineOverrideIn
    {
        public Option<Browser?> Browser { get; set; }
        public Option<string?> BrowserVersion { get; set; }
        public Option<string?> Device { get; set; }
        public Option<string?> Name { get; set; }
        public Option<OperatingSystem?> OperatingSystem { get; set; }
        public Option<string?> OperatingSystemVersion { get; set; }
        public Option<string?> SuiteName { get; set; }
        public Option<string?> TestName { get; set; }
    }

    internal class BaselineOverrideInJsonConverter : JsonConverter<BaselineOverrideIn>
    {
        public override BaselineOverrideIn? ReadJson(JsonReader reader, System.Type objectType, BaselineOverrideIn? existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            throw new System.NotSupportedException();
        }

        public override void WriteJson(JsonWriter writer, BaselineOverrideIn? value, JsonSerializer serializer)
        {
            if (value == null)
            {
                writer.WriteNull();
                return;
            }

            var dict = new Dictionary<string, object?>();
            if (value.Browser.HasValue == true)
            {
                dict["browser"] = value.Browser.Value;
            }
            if (value.BrowserVersion.HasValue == true)
            {
                dict["browserVersion"] = value.BrowserVersion.Value;
            }
            if (value.Device.HasValue == true)
            {
                dict["device"] = value.Device.Value;
            }
            if (value.Name.HasValue == true)
            {
                dict["name"] = value.Name.Value;
            }
            if (value.OperatingSystem.HasValue == true)
            {
                dict["operatingSystem"] = value.OperatingSystem.Value;
            }
            if (value.OperatingSystemVersion.HasValue == true)
            {
                dict["operatingSystemVersion"] = value.OperatingSystemVersion.Value;
            }
            if (value.SuiteName.HasValue == true)
            {
                dict["suiteName"] = value.SuiteName.Value;
            }
            if (value.TestName.HasValue == true)
            {
                dict["testName"] = value.TestName.Value;
            }

            serializer.Serialize(writer, dict);
        }
    }
}
