using OpenQA.Selenium;

namespace SauceLabs.Visual.Models
{
    public class SelectiveRegion
    {
        public IgnoreRegion? Region { get; set; }
        public IWebElement? Element { get; set; }

        public DiffingOption[]? EnableOnly { get; set; }
        public DiffingOption[]? Disable { get; set; }
    }
}