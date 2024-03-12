namespace SauceLabs.Visual.GraphQL
{

    internal static class FinishBuildMutation
    {
        public const string OperationName = "finishBuild";

        public const string OperationDocument = @"
            mutation finishBuild($input: FinishBuildIn!) {
                result: finishBuild(input: $input) {
                    id,
                    name,
                    status,
                    url
                }
            }
        ";
    }
}