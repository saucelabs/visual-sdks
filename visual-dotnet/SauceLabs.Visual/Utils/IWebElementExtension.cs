using System.Reflection;
using OpenQA.Selenium;

namespace SauceLabs.Visual.Utils
{
    internal static class IWebElementExtension
    {
        internal static string GetElementId(this IWebElement element)
        {
            var bindingFlags = BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance;
            var field = element.GetType().GetField("elementId", bindingFlags);
            var id = (string?)field?.GetValue(element);

            if (id == null)
            {
                throw new VisualClientException("Unable to retrieve Id from WebElement");
            }
            return id;
        }
    }
}
