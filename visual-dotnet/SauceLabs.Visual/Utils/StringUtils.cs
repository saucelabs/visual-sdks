namespace SauceLabs.Visual.Utils
{
    internal static class StringUtils
    {
        /// <summary>
        /// <c>IsNullOrEmpty</c> checks that the string null, empty or contains only whitespaces.
        /// </summary>
        /// <param name="value">true if string is empty</param>
        /// <returns></returns>
        public static bool IsNullOrEmpty(string? value)
        {
            return string.IsNullOrEmpty(value?.Trim());
        }
    }
}