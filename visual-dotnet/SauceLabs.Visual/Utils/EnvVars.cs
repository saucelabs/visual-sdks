using System;

namespace SauceLabs.Visual.Utils
{
    internal class EnvVars
    {
        internal static string? CustomId => Environment.GetEnvironmentVariable("SAUCE_VISUAL_CUSTOM_ID");
        internal static string? BuildId => Environment.GetEnvironmentVariable("SAUCE_VISUAL_BUILD_ID");
        internal static string? Username => Environment.GetEnvironmentVariable("SAUCE_USERNAME");
        internal static string? AccessKey => Environment.GetEnvironmentVariable("SAUCE_ACCESS_KEY");
    }
}