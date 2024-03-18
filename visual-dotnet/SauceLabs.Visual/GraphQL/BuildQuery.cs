namespace SauceLabs.Visual.GraphQL
{
    internal static class BuildQuery
    {
        public const string OperationName = "build";

        public const string OperationDocument = @"
            query build($input: UUID!) {
                result: build(id: $input) {
                    id,
                    url,
                    name,
                    mode
                }
            }
        ";
    }
}
