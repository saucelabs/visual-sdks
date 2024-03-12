namespace SauceLabs.Visual.GraphQL
{
    internal static class DiffsFromBuildId
    {
        public const string OperationName = "diffsByBuildId";

        public const string OperationDocument = @"
            query diffsByBuildId($input: UUID!) {
                result: diffs(condition: { buildId: $input }) {
                    nodes {
                        id
                        status
                    }
                }
            }
        ";
    }
}