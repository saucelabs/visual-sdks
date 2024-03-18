namespace SauceLabs.Visual.GraphQL
{
    internal static class BuildByCustomIdQuery
    {
        public const string OperationName = "buildByCustomId";

        public const string OperationDocument = @"
            query buildByCustomId($input: UUID!) {
                result: buildByCustomId(customId: $input) {
                    id,
                    url,
                    name,
                    mode
                }
            }
        ";
    }
}
