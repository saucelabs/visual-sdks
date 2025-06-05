namespace SauceLabs.Visual.Utils
{
    internal class WebDriverMetadata
    {
        public string SessionId { get; }
        public string JobId { get; }
        public string SessionMetadataBlob { get; }

        public WebDriverMetadata(string sessionId, string jobId, string sessionMetadataBlob)
        {
            SessionId = sessionId;
            JobId = jobId;
            SessionMetadataBlob = sessionMetadataBlob;
        }
    }
}
