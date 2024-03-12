namespace SauceLabs.Visual.GraphQL
{
    internal static class CreateBuildMutation
    {
        public const string OperationName = "createBuild";

        public const string OperationDocument = @"
            mutation createBuild($input: BuildIn!) {
                result: createBuild(input: $input) {
                    id,
                    customId,
                    url,
                    project,
                    branch,
                    name
                }
            }
        ";
    }
}
