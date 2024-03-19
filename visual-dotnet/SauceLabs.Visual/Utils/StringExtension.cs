namespace SauceLabs.Visual.Utils
{
    public static class StringExtension
    {
        /// <summary>
        /// <c>IsEmpty</c> checks that the string is empty or contains only whitespaces.
        /// </summary>
        /// <param name="value">true if string is empty</param>
        /// <returns></returns>
        public static bool IsEmpty(this string value)
        {
            return value.Trim().Length == 0;
        }
    }
}