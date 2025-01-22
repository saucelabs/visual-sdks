using SauceLabs.Visual.Utils;

namespace SauceLabs.Visual
{
    public class VisualCredential
    {
        public string Username { get; }
        public string AccessKey { get; }

        private VisualCredential(string username, string accessKey)
        {
            Username = username;
            AccessKey = accessKey;
        }

        public static VisualCredential Create(string username, string accessKey)
        {
            return new VisualCredential(username, accessKey);
        }

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