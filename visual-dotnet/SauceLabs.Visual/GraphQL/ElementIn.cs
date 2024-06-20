using Newtonsoft.Json;
using OpenQA.Selenium;
using SauceLabs.Visual.Models;
using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual.GraphQL
{
    internal class ElementIn
    {
        [JsonProperty("name")]
        public string? Name { get; }
        [JsonProperty("id")]
        public string Id { get; }

        [JsonProperty("diffingOptions")]
        public DiffingOptionsIn? DiffingOptions { get; }

        public ElementIn(IWebElement element, DiffingOptionsIn opts) : this(element, null, opts)
        {
        }

        public ElementIn(IWebElement element, string? name = null, DiffingOptionsIn? diffingOptions = null)
        {
            Id = element.GetElementId();
            Name = name;
            DiffingOptions = diffingOptions;
        }
    }
}