using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual
{
    /// <summary>
    /// <c>VisualCredential</c> contains a set of credentials for Sauce Labs
    /// </summary>
    public class VisualCredential
    {
        public string Username { get; }
        public string AccessKey { get; }

        private VisualCredential(string username, string accessKey)
        {
            Username = username;
            AccessKey = accessKey;
        }

        /// <summary>
        /// Create a <c>VisualCredential</c> instance from a username and an access key.
        /// </summary>
        /// <param name="username">the Sauce Labs username</param>
        /// <param name="accessKey">the Sauce Labs access key</param>
        /// <returns>An instance of <c>VisualCredentials</c></returns>
        public static VisualCredential Create(string username, string accessKey)
        {
            return new VisualCredential(username, accessKey);
        }

        /// <summary>
        /// Create a <c>VisualCredential</c> instance from environements variables (SAUCE_USERNAME and SAUCE_ACCESS_KEY).
        /// </summary>
        /// <returns>An instance of <c>VisualCredentials</c></returns>
        public static VisualCredential CreateFromEnvironment()
        {
            var username = EnvVars.Username ?? "";
            var accessKey = EnvVars.AccessKey ?? "";

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(accessKey))
            {
                throw new VisualClientException("SAUCE_USERNAME or SAUCE_ACCESS_KEY is not defined");
            }

            return new VisualCredential(username, accessKey);
        }
    }
}
