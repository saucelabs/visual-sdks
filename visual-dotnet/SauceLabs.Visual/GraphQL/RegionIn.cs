using Newtonsoft.Json;
using OpenQA.Selenium;
using SauceLabs.Visual.Models;

namespace SauceLabs.Visual.GraphQL
{
    internal class RegionIn
    {
        [JsonProperty("name")]
        public string? Name { get; }
        [JsonProperty("x")]
        public int X { get; }
        [JsonProperty("y")]
        public int Y { get; }
        [JsonProperty("width")]
        public int Width { get; }
        [JsonProperty("height")]
        public int Height { get; }
        [JsonProperty("diffingOptions")]
        public DiffingOptionsIn? DiffingOptions { get; }

        public RegionIn(int x, int y, int width, int height)
        {
            X = x;
            Y = y;
            Width = width;
            Height = height;
        }
        public RegionIn(string name, int x, int y, int width, int height) : this(x, y, width, height)
        {
            Name = name;
        }

        public RegionIn(int x, int y, int width, int height, DiffingOptionsIn diffingOptions) : this(x, y, width, height)
        {
            DiffingOptions = diffingOptions;
        }

        public RegionIn(IWebElement input) : this(input.Location.X, input.Location.Y, input.Size.Width, input.Size.Height)
        { }

        public RegionIn(IWebElement input, DiffingOptionsIn diffingOption) : this(input.Location.X, input.Location.Y, input.Size.Width, input.Size.Height, diffingOption)
        { }

        public RegionIn(IgnoreRegion input) : this(input.X, input.Y, input.Width, input.Height)
        { }

        public RegionIn(IgnoreRegion input, DiffingOptionsIn diffingOptions) : this(input.X, input.Y, input.Width, input.Height, diffingOptions)
        { }
    }
}