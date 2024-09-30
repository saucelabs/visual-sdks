using System;

namespace SauceLabs.Visual.Utils
{
    internal class EnvVars
    {
        internal static string? Project => Environment.GetEnvironmentVariable("SAUCE_VISUAL_PROJECT");
        internal static string? Branch => Environment.GetEnvironmentVariable("SAUCE_VISUAL_BRANCH");

        internal static string? DefaultBranch =>
            Environment.GetEnvironmentVariable("SAUCE_VISUAL_DEFAULT_BRANCH");

        internal static string BuildName => Environment.GetEnvironmentVariable("SAUCE_VISUAL_BUILD_NAME") ?? "";
        internal static string? CustomId => Environment.GetEnvironmentVariable("SAUCE_VISUAL_CUSTOM_ID");
        internal static string? BuildId => Environment.GetEnvironmentVariable("SAUCE_VISUAL_BUILD_ID");
        internal static string? Username => Environment.GetEnvironmentVariable("SAUCE_USERNAME");
        internal static string? AccessKey => Environment.GetEnvironmentVariable("SAUCE_ACCESS_KEY");
        internal static string? Region => Environment.GetEnvironmentVariable("SAUCE_REGION");
    }
}