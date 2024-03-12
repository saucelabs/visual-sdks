using SauceLabs.Visual.Models;

namespace SauceLabs.Visual.GraphQL
{

    internal static class CreateSnapshotFromWebDriverMutation
    {
        public const string OperationName = "createSnapshotFromWebDriver";

        public const string OperationDocument = @"
            mutation createSnapshotFromWebDriver($input: CreateSnapshotFromWebDriverIn!) {
                result: createSnapshotFromWebDriver(input: $input) {
                    id
                    uploadId
                    diffs {
                        nodes {
                            id
                            __typename
                            baselineId
                            snapshotId
                            status
                            diffBounds {
                                x
                                y
                                width
                                height
                            }
                            diffClusters {
                                x
                                y
                                width
                                height
                            }
                        }
                    }
                }
            }
        ";
    }
}