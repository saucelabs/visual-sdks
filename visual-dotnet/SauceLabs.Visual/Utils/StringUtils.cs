using System.Linq;
using GraphQL;

namespace SauceLabs.Visual.Utils
{
    public static class StringUtils
    {
        public static bool HasContent(string? value)
        {
            return value != null && value.Trim().Length > 0;
        }
    }
}
