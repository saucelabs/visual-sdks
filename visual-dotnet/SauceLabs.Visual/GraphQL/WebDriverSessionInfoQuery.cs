namespace SauceLabs.Visual.GraphQL
{

    internal static class WebDriverSessionInfoQuery
    {
        public const string OperationName = "webdriverSessionInfo";

        public const string OperationDocument = @"
            query webdriverSessionInfo($jobId: ID!, $sessionId: ID!) {
                result: webdriverSessionInfo(input: { jobId: $jobId, sessionId: $sessionId }) {
                    blob
                }
            }
        ";
    }
}