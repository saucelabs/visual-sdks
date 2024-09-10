/* eslint-disable */
import * as types from './graphql.js';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "query build($input: UUID!) {\n  result: build(id: $input) {\n    id\n    name\n    url\n    status\n    project\n    branch\n    defaultBranch\n    mode\n  }\n}": types.BuildDocument,
    "query buildByCustomId($input: String!) {\n  result: buildByCustomId(customId: $input) {\n    id\n    name\n    url\n    status\n    project\n    branch\n    mode\n  }\n}": types.BuildByCustomIdDocument,
    "query buildStatus($input: UUID!) {\n  result: build(id: $input) {\n    url\n    status\n    unapprovedCount: diffCountExtended(input: {status: UNAPPROVED})\n    errorCount: diffCountExtended(input: {status: ERRORED})\n  }\n}": types.BuildStatusDocument,
    "query buildWithDiffs($input: UUID!) {\n  result: build(id: $input) {\n    id\n    name\n    url\n    status\n    project\n    branch\n    diffs {\n      nodes {\n        id\n        baselineId\n        status\n        baseline {\n          snapshot {\n            buildId\n          }\n        }\n        diffBounds {\n          x\n          y\n        }\n        diffClusters {\n          x\n          y\n          width\n          height\n        }\n      }\n    }\n  }\n}": types.BuildWithDiffsDocument,
    "query buildWithDiffsByCustomId($input: String!) {\n  result: buildByCustomId(customId: $input) {\n    id\n    name\n    url\n    status\n    project\n    branch\n    diffs {\n      nodes {\n        id\n        baselineId\n        status\n        baseline {\n          snapshot {\n            buildId\n          }\n        }\n        diffBounds {\n          x\n          y\n        }\n        diffClusters {\n          x\n          y\n        }\n      }\n    }\n  }\n}": types.BuildWithDiffsByCustomIdDocument,
    "mutation createBuild($input: BuildIn!) {\n  result: createBuild(input: $input) {\n    id\n    name\n    project\n    branch\n    defaultBranch\n    status\n    url\n  }\n}": types.CreateBuildDocument,
    "mutation createSnapshot($input: SnapshotIn!) {\n  result: createSnapshot(input: $input) {\n    id\n    uploadId\n    diffs {\n      nodes {\n        id\n        baselineId\n        snapshotId\n        status\n        diffBounds {\n          x\n          y\n          width\n          height\n        }\n        diffClusters {\n          x\n          y\n          width\n          height\n        }\n      }\n    }\n  }\n}": types.CreateSnapshotDocument,
    "mutation createSnapshotFromWebDriver($input: CreateSnapshotFromWebDriverIn!) {\n  result: createSnapshotFromWebDriver(input: $input) {\n    id\n    uploadId\n    diffs {\n      nodes {\n        id\n        baselineId\n        snapshotId\n        status\n        diffBounds {\n          x\n          y\n          width\n          height\n        }\n        diffClusters {\n          x\n          y\n          width\n          height\n        }\n      }\n    }\n  }\n}": types.CreateSnapshotFromWebDriverDocument,
    "mutation createSnapshotUpload($input: SnapshotUploadIn!) {\n  result: createSnapshotUpload(input: $input) {\n    id\n    buildId\n    imageUploadUrl\n    domUploadUrl\n  }\n}": types.CreateSnapshotUploadDocument,
    "query diffsForTestResult($input: UUID!) {\n  result: diffs(condition: {buildId: $input}) {\n    nodes {\n      id\n      status\n    }\n  }\n}": types.DiffsForTestResultDocument,
    "mutation FinishBuildDocument($input: FinishBuildIn!) {\n  result: finishBuild(input: $input) {\n    id\n    name\n    status\n    url\n  }\n}": types.FinishBuildDocumentDocument,
    "mutation mergeBaselines($input: MergeBaselinesInput!) {\n  result: mergeBaselines(input: $input) {\n    baselines {\n      id\n    }\n  }\n}": types.MergeBaselinesDocument,
    "mutation UpdateDiff($input: UpdateDiffIn!) {\n  result: updateDiff(input: $input) {\n    id\n    status\n    baselineId\n    snapshotId\n  }\n}": types.UpdateDiffDocument,
    "query webdriverSessionInfo($input: WebdriverSessionInfoIn!) {\n  result: webdriverSessionInfo(input: $input) {\n    blob\n    operatingSystem\n    operatingSystemVersion\n    browser\n    browserVersion\n    deviceName\n  }\n}": types.WebdriverSessionInfoDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query build($input: UUID!) {\n  result: build(id: $input) {\n    id\n    name\n    url\n    status\n    project\n    branch\n    defaultBranch\n    mode\n  }\n}"): (typeof documents)["query build($input: UUID!) {\n  result: build(id: $input) {\n    id\n    name\n    url\n    status\n    project\n    branch\n    defaultBranch\n    mode\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query buildByCustomId($input: String!) {\n  result: buildByCustomId(customId: $input) {\n    id\n    name\n    url\n    status\n    project\n    branch\n    mode\n  }\n}"): (typeof documents)["query buildByCustomId($input: String!) {\n  result: buildByCustomId(customId: $input) {\n    id\n    name\n    url\n    status\n    project\n    branch\n    mode\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query buildStatus($input: UUID!) {\n  result: build(id: $input) {\n    url\n    status\n    unapprovedCount: diffCountExtended(input: {status: UNAPPROVED})\n    errorCount: diffCountExtended(input: {status: ERRORED})\n  }\n}"): (typeof documents)["query buildStatus($input: UUID!) {\n  result: build(id: $input) {\n    url\n    status\n    unapprovedCount: diffCountExtended(input: {status: UNAPPROVED})\n    errorCount: diffCountExtended(input: {status: ERRORED})\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query buildWithDiffs($input: UUID!) {\n  result: build(id: $input) {\n    id\n    name\n    url\n    status\n    project\n    branch\n    diffs {\n      nodes {\n        id\n        baselineId\n        status\n        baseline {\n          snapshot {\n            buildId\n          }\n        }\n        diffBounds {\n          x\n          y\n        }\n        diffClusters {\n          x\n          y\n          width\n          height\n        }\n      }\n    }\n  }\n}"): (typeof documents)["query buildWithDiffs($input: UUID!) {\n  result: build(id: $input) {\n    id\n    name\n    url\n    status\n    project\n    branch\n    diffs {\n      nodes {\n        id\n        baselineId\n        status\n        baseline {\n          snapshot {\n            buildId\n          }\n        }\n        diffBounds {\n          x\n          y\n        }\n        diffClusters {\n          x\n          y\n          width\n          height\n        }\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query buildWithDiffsByCustomId($input: String!) {\n  result: buildByCustomId(customId: $input) {\n    id\n    name\n    url\n    status\n    project\n    branch\n    diffs {\n      nodes {\n        id\n        baselineId\n        status\n        baseline {\n          snapshot {\n            buildId\n          }\n        }\n        diffBounds {\n          x\n          y\n        }\n        diffClusters {\n          x\n          y\n        }\n      }\n    }\n  }\n}"): (typeof documents)["query buildWithDiffsByCustomId($input: String!) {\n  result: buildByCustomId(customId: $input) {\n    id\n    name\n    url\n    status\n    project\n    branch\n    diffs {\n      nodes {\n        id\n        baselineId\n        status\n        baseline {\n          snapshot {\n            buildId\n          }\n        }\n        diffBounds {\n          x\n          y\n        }\n        diffClusters {\n          x\n          y\n        }\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation createBuild($input: BuildIn!) {\n  result: createBuild(input: $input) {\n    id\n    name\n    project\n    branch\n    defaultBranch\n    status\n    url\n  }\n}"): (typeof documents)["mutation createBuild($input: BuildIn!) {\n  result: createBuild(input: $input) {\n    id\n    name\n    project\n    branch\n    defaultBranch\n    status\n    url\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation createSnapshot($input: SnapshotIn!) {\n  result: createSnapshot(input: $input) {\n    id\n    uploadId\n    diffs {\n      nodes {\n        id\n        baselineId\n        snapshotId\n        status\n        diffBounds {\n          x\n          y\n          width\n          height\n        }\n        diffClusters {\n          x\n          y\n          width\n          height\n        }\n      }\n    }\n  }\n}"): (typeof documents)["mutation createSnapshot($input: SnapshotIn!) {\n  result: createSnapshot(input: $input) {\n    id\n    uploadId\n    diffs {\n      nodes {\n        id\n        baselineId\n        snapshotId\n        status\n        diffBounds {\n          x\n          y\n          width\n          height\n        }\n        diffClusters {\n          x\n          y\n          width\n          height\n        }\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation createSnapshotFromWebDriver($input: CreateSnapshotFromWebDriverIn!) {\n  result: createSnapshotFromWebDriver(input: $input) {\n    id\n    uploadId\n    diffs {\n      nodes {\n        id\n        baselineId\n        snapshotId\n        status\n        diffBounds {\n          x\n          y\n          width\n          height\n        }\n        diffClusters {\n          x\n          y\n          width\n          height\n        }\n      }\n    }\n  }\n}"): (typeof documents)["mutation createSnapshotFromWebDriver($input: CreateSnapshotFromWebDriverIn!) {\n  result: createSnapshotFromWebDriver(input: $input) {\n    id\n    uploadId\n    diffs {\n      nodes {\n        id\n        baselineId\n        snapshotId\n        status\n        diffBounds {\n          x\n          y\n          width\n          height\n        }\n        diffClusters {\n          x\n          y\n          width\n          height\n        }\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation createSnapshotUpload($input: SnapshotUploadIn!) {\n  result: createSnapshotUpload(input: $input) {\n    id\n    buildId\n    imageUploadUrl\n    domUploadUrl\n  }\n}"): (typeof documents)["mutation createSnapshotUpload($input: SnapshotUploadIn!) {\n  result: createSnapshotUpload(input: $input) {\n    id\n    buildId\n    imageUploadUrl\n    domUploadUrl\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query diffsForTestResult($input: UUID!) {\n  result: diffs(condition: {buildId: $input}) {\n    nodes {\n      id\n      status\n    }\n  }\n}"): (typeof documents)["query diffsForTestResult($input: UUID!) {\n  result: diffs(condition: {buildId: $input}) {\n    nodes {\n      id\n      status\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation FinishBuildDocument($input: FinishBuildIn!) {\n  result: finishBuild(input: $input) {\n    id\n    name\n    status\n    url\n  }\n}"): (typeof documents)["mutation FinishBuildDocument($input: FinishBuildIn!) {\n  result: finishBuild(input: $input) {\n    id\n    name\n    status\n    url\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation mergeBaselines($input: MergeBaselinesInput!) {\n  result: mergeBaselines(input: $input) {\n    baselines {\n      id\n    }\n  }\n}"): (typeof documents)["mutation mergeBaselines($input: MergeBaselinesInput!) {\n  result: mergeBaselines(input: $input) {\n    baselines {\n      id\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UpdateDiff($input: UpdateDiffIn!) {\n  result: updateDiff(input: $input) {\n    id\n    status\n    baselineId\n    snapshotId\n  }\n}"): (typeof documents)["mutation UpdateDiff($input: UpdateDiffIn!) {\n  result: updateDiff(input: $input) {\n    id\n    status\n    baselineId\n    snapshotId\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query webdriverSessionInfo($input: WebdriverSessionInfoIn!) {\n  result: webdriverSessionInfo(input: $input) {\n    blob\n    operatingSystem\n    operatingSystemVersion\n    browser\n    browserVersion\n    deviceName\n  }\n}"): (typeof documents)["query webdriverSessionInfo($input: WebdriverSessionInfoIn!) {\n  result: webdriverSessionInfo(input: $input) {\n    blob\n    operatingSystem\n    operatingSystemVersion\n    browser\n    browserVersion\n    deviceName\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;