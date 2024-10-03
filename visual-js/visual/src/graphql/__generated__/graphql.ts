/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** A location in a connection that can be used for resuming pagination. */
  Cursor: any;
  /**
   * A point in time as described by the [ISO
   * 8601](https://en.wikipedia.org/wiki/ISO_8601) standard. May or may not include a timezone.
   */
  Datetime: Date | string | number;
  FullText: any;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
  /** A universally unique identifier as defined by [RFC 4122](https://tools.ietf.org/html/rfc4122). */
  UUID: string;
  WebdriverElementID: string;
  WebdriverSessionBlob: string;
};

export type ApplicationSummary = {
  __typename?: 'ApplicationSummary';
  id: Scalars['String'];
  name: Scalars['String'];
  version: Scalars['String'];
};

export type ApproveBuildIn = {
  /** @deprecated Use `uuid`. This field will be removed in a future update. */
  id?: InputMaybe<Scalars['ID']>;
  onlyNew?: InputMaybe<Scalars['Boolean']>;
  uuid?: InputMaybe<Scalars['UUID']>;
};

/**
 * A `Baseline` is what a `Snapshot` is compared to.
 *
 * For details see https://docs.saucelabs.com/visual-testing/sauce-visual/index.html#baseline-matching
 */
export type Baseline = Node & {
  __typename?: 'Baseline';
  appId: Maybe<Scalars['String']>;
  appName: Maybe<Scalars['String']>;
  appVersion: Maybe<Scalars['String']>;
  branch: Maybe<Scalars['String']>;
  browser: Maybe<Browser>;
  browserVersion: Maybe<Scalars['String']>;
  createdAt: Scalars['Datetime'];
  createdByOrgId: Scalars['UUID'];
  createdByUser: User;
  createdByUserId: Scalars['UUID'];
  device: Maybe<Scalars['String']>;
  /** Reads and enables pagination through a set of `Diff`. */
  diffs: DiffsConnection;
  hasDom: Scalars['Boolean'];
  id: Scalars['UUID'];
  ignoreRegions: Array<Maybe<Region>>;
  imageUrl: Scalars['String'];
  isLatest: Scalars['Boolean'];
  latest: Baseline;
  metadata: Maybe<Scalars['JSON']>;
  name: Scalars['String'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID'];
  operatingSystem: Maybe<OperatingSystem>;
  operatingSystemVersion: Maybe<Scalars['String']>;
  parentId: Maybe<Scalars['UUID']>;
  project: Maybe<Scalars['String']>;
  /** Reads a single `Snapshot` that is related to this `Baseline`. */
  snapshot: Maybe<Snapshot>;
  snapshotId: Maybe<Scalars['UUID']>;
  suiteName: Maybe<Scalars['String']>;
  testName: Maybe<Scalars['String']>;
  uiIgnoreRegions: Array<Maybe<Region>>;
  uploadId: Scalars['String'];
  viewportHeight: Maybe<Scalars['Int']>;
  viewportWidth: Maybe<Scalars['Int']>;
};


/**
 * A `Baseline` is what a `Snapshot` is compared to.
 *
 * For details see https://docs.saucelabs.com/visual-testing/sauce-visual/index.html#baseline-matching
 */
export type BaselineDiffsArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  condition: InputMaybe<DiffCondition>;
  filter: InputMaybe<DiffFilter>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Array<DiffsOrderBy>>;
};

/**
 * A condition to be used against `Baseline` object types. All fields are tested
 * for equality and combined with a logical ‘and.’
 */
export type BaselineCondition = {
  /** Checks for equality with the object’s `createdAt` field. */
  createdAt?: InputMaybe<Scalars['Datetime']>;
  /** Checks for equality with the object’s `createdByOrgId` field. */
  createdByOrgId?: InputMaybe<Scalars['UUID']>;
  /** Checks for equality with the object’s `createdByUserId` field. */
  createdByUserId?: InputMaybe<Scalars['UUID']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']>;
  /** Checks for equality with the object’s `snapshotId` field. */
  snapshotId?: InputMaybe<Scalars['UUID']>;
};

/** A filter to be used against `Baseline` object types. All fields are combined with a logical ‘and.’ */
export type BaselineFilter = {
  /** Filter by the object’s `createdAt` field. */
  createdAt?: InputMaybe<DatetimeFilter>;
  /** Filter by the object’s `createdByOrgId` field. */
  createdByOrgId?: InputMaybe<UuidFilter>;
  /** Filter by the object’s `createdByUserId` field. */
  createdByUserId?: InputMaybe<UuidFilter>;
  /** Filter by the object’s `id` field. */
  id?: InputMaybe<UuidFilter>;
  /** Filter by the object’s `snapshotId` field. */
  snapshotId?: InputMaybe<UuidFilter>;
};

/** One or more values from 'SnapshotIn' we should use as an override when finding a baseline. */
export type BaselineOverrideIn = {
  browser?: InputMaybe<Browser>;
  browserVersion?: InputMaybe<Scalars['String']>;
  device?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  operatingSystem?: InputMaybe<OperatingSystem>;
  operatingSystemVersion?: InputMaybe<Scalars['String']>;
  suiteName?: InputMaybe<Scalars['String']>;
  testName?: InputMaybe<Scalars['String']>;
};

/** A connection to a list of `Baseline` values. */
export type BaselinesConnection = {
  __typename?: 'BaselinesConnection';
  /** A list of edges which contains the `Baseline` and cursor to aid in pagination. */
  edges: Array<BaselinesEdge>;
  /** A list of `Baseline` objects. */
  nodes: Array<Baseline>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `Baseline` you could get from the connection. */
  totalCount: Scalars['Int'];
};

/** A `Baseline` edge in the connection. */
export type BaselinesEdge = {
  __typename?: 'BaselinesEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']>;
  /** The `Baseline` at the end of the edge. */
  node: Baseline;
};

/** Methods to use when ordering `Baseline`. */
export enum BaselinesOrderBy {
  CreatedAtAsc = 'CREATED_AT_ASC',
  CreatedAtDesc = 'CREATED_AT_DESC',
  CreatedByOrgIdAsc = 'CREATED_BY_ORG_ID_ASC',
  CreatedByOrgIdDesc = 'CREATED_BY_ORG_ID_DESC',
  CreatedByUserIdAsc = 'CREATED_BY_USER_ID_ASC',
  CreatedByUserIdDesc = 'CREATED_BY_USER_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  SnapshotIdAsc = 'SNAPSHOT_ID_ASC',
  SnapshotIdDesc = 'SNAPSHOT_ID_DESC'
}

export type Branch = Node & {
  __typename?: 'Branch';
  lastUsed: Scalars['Datetime'];
  name: Scalars['String'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID'];
  /** Reads a single `Project` that is related to this `Branch`. */
  project: Maybe<Project>;
  projectName: Scalars['String'];
};

/** A connection to a list of `Branch` values. */
export type BranchesConnection = {
  __typename?: 'BranchesConnection';
  /** A list of edges which contains the `Branch` and cursor to aid in pagination. */
  edges: Array<BranchesEdge>;
  /** A list of `Branch` objects. */
  nodes: Array<Branch>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `Branch` you could get from the connection. */
  totalCount: Scalars['Int'];
};

/** A `Branch` edge in the connection. */
export type BranchesEdge = {
  __typename?: 'BranchesEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']>;
  /** The `Branch` at the end of the edge. */
  node: Branch;
};

/** Methods to use when ordering `Branch`. */
export enum BranchesOrderBy {
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

export enum Browser {
  Chrome = 'CHROME',
  Edge = 'EDGE',
  Firefox = 'FIREFOX',
  PlaywrightWebkit = 'PLAYWRIGHT_WEBKIT',
  Safari = 'SAFARI'
}

/** The result of diffing a `Baseline` with a `Snapshot`. */
export type Build = Node & {
  __typename?: 'Build';
  branch: Maybe<Scalars['String']>;
  createdAt: Scalars['Datetime'];
  createdByOrgId: Scalars['UUID'];
  createdByUser: User;
  createdByUserId: Scalars['UUID'];
  /**
   * User provided id for a build.
   *
   * Use `buildByCustomId` to look up a build by its `customId`.
   *
   * Properties:
   * - up to 64 bytes (try to stick to ASCII characters)
   * - in case of colissions, the latest build is returned
   * - collissions may hurt query performance
   *
   * Recommendations:
   * - generate the id from the CI pipeline link by applying a hashing function
   * - prefix/postfix the id with a team id to avoid collisions with other teams, e.g. `sha512(teamId + ':' + url)`
   */
  customId: Maybe<Scalars['String']>;
  defaultBranch: Maybe<Scalars['String']>;
  /** @deprecated Use diffCountExtended. This will be removed by 2024-02-11. */
  diffCount: Scalars['Int'];
  /**
   * Returns the number of diffs in a build that have a specific status.
   *
   * E.g. to get the number of "new" snapshots use `{ status: UNAPPROVED, withBaseline: false}`
   */
  diffCountExtended: Scalars['Int'];
  /** Reads and enables pagination through a set of `Diff`. */
  diffs: DiffsConnection;
  /**
   * If not null, it indicates that the build encountered an error.
   *
   * By convention, the following errors exist:
   * - `{"code": "TIMEOUT"}`: The build timed out, because `finishBuild` was not called.
   * - `{"code": "DIFF_TIMEOUT"}`: At least one diff could not be computed within the time limit.
   *
   * Other error types may exist and the frontend should display a generic error message
   * together with the JSON contents of `error`.
   */
  error: Maybe<Scalars['JSON']>;
  finishAfter: Maybe<Scalars['Datetime']>;
  /** Full-text search ranking when filtered by `fullText`. */
  fullTextRank: Maybe<Scalars['Float']>;
  id: Scalars['UUID'];
  keepAliveTimeout: Maybe<Scalars['Int']>;
  mode: BuildMode;
  name: Scalars['String'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID'];
  openSessions: Maybe<Scalars['Int']>;
  owningTeamId: Scalars['UUID'];
  project: Maybe<Scalars['String']>;
  /** Reads and enables pagination through a set of `Snapshot`. */
  snapshots: SnapshotsConnection;
  status: BuildStatus;
  url: Scalars['String'];
};


/** The result of diffing a `Baseline` with a `Snapshot`. */
export type BuildDiffCountArgs = {
  status: DiffStatus;
};


/** The result of diffing a `Baseline` with a `Snapshot`. */
export type BuildDiffCountExtendedArgs = {
  input: DiffCountIn;
};


/** The result of diffing a `Baseline` with a `Snapshot`. */
export type BuildDiffsArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  condition: InputMaybe<DiffCondition>;
  filter: InputMaybe<DiffFilter>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Array<DiffsOrderBy>>;
};


/** The result of diffing a `Baseline` with a `Snapshot`. */
export type BuildSnapshotsArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  condition: InputMaybe<SnapshotCondition>;
  filter: InputMaybe<SnapshotFilter>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Array<SnapshotsOrderBy>>;
};

/** A condition to be used against `Build` object types. All fields are tested for equality and combined with a logical ‘and.’ */
export type BuildCondition = {
  /** Checks for equality with the object’s `branch` field. */
  branch?: InputMaybe<Scalars['String']>;
  /** Checks for equality with the object’s `createdAt` field. */
  createdAt?: InputMaybe<Scalars['Datetime']>;
  /** Checks for equality with the object’s `createdByOrgId` field. */
  createdByOrgId?: InputMaybe<Scalars['UUID']>;
  /** Checks for equality with the object’s `createdByUserId` field. */
  createdByUserId?: InputMaybe<Scalars['UUID']>;
  /** Checks for equality with the object’s `fullText` field. */
  fullText?: InputMaybe<Scalars['FullText']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']>;
  /** Checks for equality with the object’s `owningTeamId` field. */
  owningTeamId?: InputMaybe<Scalars['UUID']>;
  /** Checks for equality with the object’s `project` field. */
  project?: InputMaybe<Scalars['String']>;
  /** Checks for equality with the object’s `status` field. */
  status?: InputMaybe<BuildStatus>;
};

/** A filter to be used against `Build` object types. All fields are combined with a logical ‘and.’ */
export type BuildFilter = {
  /** Filter by the object’s `branch` field. */
  branch?: InputMaybe<StringFilter>;
  /** Filter by the object’s `createdAt` field. */
  createdAt?: InputMaybe<DatetimeFilter>;
  /** Filter by the object’s `createdByOrgId` field. */
  createdByOrgId?: InputMaybe<UuidFilter>;
  /** Filter by the object’s `createdByUserId` field. */
  createdByUserId?: InputMaybe<UuidFilter>;
  /** Filter by the object’s `fullText` field. */
  fullText?: InputMaybe<FullTextFilter>;
  /** Filter by the object’s `id` field. */
  id?: InputMaybe<UuidFilter>;
  /** Filter by the object’s `owningTeamId` field. */
  owningTeamId?: InputMaybe<UuidFilter>;
  /** Filter by the object’s `project` field. */
  project?: InputMaybe<StringFilter>;
  /** Filter by the object’s `status` field. */
  status?: InputMaybe<BuildStatusFilter>;
};

export type BuildIn = {
  branch?: InputMaybe<Scalars['String']>;
  customId?: InputMaybe<Scalars['String']>;
  defaultBranch?: InputMaybe<Scalars['String']>;
  /**
   * A positive integer that is the time in seconds that the Build is allowed to be in the RUNNING state after the last snapshot was created or updated.
   * The number clipped to the interval [1;86400].
   */
  keepAliveTimeout?: InputMaybe<Scalars['Int']>;
  name?: InputMaybe<Scalars['String']>;
  project?: InputMaybe<Scalars['String']>;
};

export enum BuildMode {
  Completed = 'COMPLETED',
  Running = 'RUNNING'
}

/**
 * Lifecycle status of a `Build`.
 *
 * 1. A new `Build` is always in `RUNNING` state.
 * 2. When the `finishBuild` mutation was called, its state is as follows:
 *    - `ERRORED` if build.error is not null or else
 *    - `EMPTY` if there are no Diffs in the Build or else
 *    - `RUNNING` if any Diff in the Build is QUEUED or else
 *    - `ERRORED` if any Diff in the Build is ERRORED or else
 *    - `UNAPPROVED` if any Diff in the Build is UNAPPROVED or else
 *    - `REJECTED` if any Diff in the Build is REJECTED or else
 *    - `APPROVED` if any Diff in the Build is APPROVED and
 *    - `EQUAL` in any other case
 *
 * When `finishBuild` is not called, the build will time out and end up in the `ERRORED` state.
 */
export enum BuildStatus {
  Approved = 'APPROVED',
  Empty = 'EMPTY',
  Equal = 'EQUAL',
  Errored = 'ERRORED',
  Queued = 'QUEUED',
  Rejected = 'REJECTED',
  Running = 'RUNNING',
  Unapproved = 'UNAPPROVED'
}

/** A filter to be used against BuildStatus fields. All fields are combined with a logical ‘and.’ */
export type BuildStatusFilter = {
  /** Greater than the specified value. */
  greaterThan?: InputMaybe<BuildStatus>;
  /** Greater than or equal to the specified value. */
  greaterThanOrEqualTo?: InputMaybe<BuildStatus>;
  /** Included in the specified list. */
  in?: InputMaybe<Array<BuildStatus>>;
  /** Less than the specified value. */
  lessThan?: InputMaybe<BuildStatus>;
  /** Less than or equal to the specified value. */
  lessThanOrEqualTo?: InputMaybe<BuildStatus>;
};

/** A connection to a list of `Build` values. */
export type BuildsConnection = {
  __typename?: 'BuildsConnection';
  /** A list of edges which contains the `Build` and cursor to aid in pagination. */
  edges: Array<BuildsEdge>;
  /** A list of `Build` objects. */
  nodes: Array<Build>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `Build` you could get from the connection. */
  totalCount: Scalars['Int'];
};

/** A `Build` edge in the connection. */
export type BuildsEdge = {
  __typename?: 'BuildsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']>;
  /** The `Build` at the end of the edge. */
  node: Build;
};

/** Methods to use when ordering `Build`. */
export enum BuildsOrderBy {
  BranchAsc = 'BRANCH_ASC',
  BranchDesc = 'BRANCH_DESC',
  CreatedAtAsc = 'CREATED_AT_ASC',
  CreatedAtDesc = 'CREATED_AT_DESC',
  CreatedByOrgIdAsc = 'CREATED_BY_ORG_ID_ASC',
  CreatedByOrgIdAscCustomIdAsc = 'CREATED_BY_ORG_ID_ASC__CUSTOM_ID_ASC',
  CreatedByOrgIdDesc = 'CREATED_BY_ORG_ID_DESC',
  CreatedByOrgIdDescCustomIdDesc = 'CREATED_BY_ORG_ID_DESC__CUSTOM_ID_DESC',
  CreatedByUserIdAsc = 'CREATED_BY_USER_ID_ASC',
  CreatedByUserIdDesc = 'CREATED_BY_USER_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  OwningTeamIdAsc = 'OWNING_TEAM_ID_ASC',
  OwningTeamIdDesc = 'OWNING_TEAM_ID_DESC',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  ProjectAsc = 'PROJECT_ASC',
  ProjectDesc = 'PROJECT_DESC',
  StatusAsc = 'STATUS_ASC',
  StatusDesc = 'STATUS_DESC'
}

export type CreateDerivedBaselinesIn = {
  baselineIds: Array<Scalars['UUID']>;
  uiIgnoreRegions: Array<RegionIn>;
};

export type CreateSnapshotFromWebDriverIn = {
  /**
   * One or more overrides for locating the matching baseline. Can be used for cross browser / OS
   * visual testing.
   */
  baselineOverride?: InputMaybe<BaselineOverrideIn>;
  /** @deprecated Use `buildUuid`. This field will be removed in a future update. */
  buildId?: InputMaybe<Scalars['ID']>;
  buildUuid?: InputMaybe<Scalars['UUID']>;
  captureDom?: InputMaybe<Scalars['Boolean']>;
  /** The selenium ID of an element we should clip the screen to. */
  clipElement?: InputMaybe<Scalars['WebdriverElementID']>;
  /** A querySelector compatible selector of an element that we should crop the screenshot to. */
  clipSelector?: InputMaybe<Scalars['String']>;
  diffingMethod?: InputMaybe<DiffingMethod>;
  diffingOptions?: InputMaybe<DiffingOptionsIn>;
  /**
   * Enable full page screenshot using scroll-and-stitch strategy.
   * Limitation: Currently, this feature is supported only on desktop browsers.
   */
  fullPageConfig?: InputMaybe<FullPageConfigIn>;
  ignoreElements?: InputMaybe<Array<ElementIn>>;
  ignoreRegions?: InputMaybe<Array<RegionIn>>;
  /** This will be mandatory in the future. */
  jobId?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  sessionId: Scalars['ID'];
  /** Pass the `blob` field from the `webdriverSessionInfo` query here. */
  sessionMetadata: Scalars['WebdriverSessionBlob'];
  suiteName?: InputMaybe<Scalars['String']>;
  testName?: InputMaybe<Scalars['String']>;
};

/** A filter to be used against Datetime fields. All fields are combined with a logical ‘and.’ */
export type DatetimeFilter = {
  /** Greater than the specified value. */
  greaterThan?: InputMaybe<Scalars['Datetime']>;
  /** Greater than or equal to the specified value. */
  greaterThanOrEqualTo?: InputMaybe<Scalars['Datetime']>;
  /** Included in the specified list. */
  in?: InputMaybe<Array<Scalars['Datetime']>>;
  /** Less than the specified value. */
  lessThan?: InputMaybe<Scalars['Datetime']>;
  /** Less than or equal to the specified value. */
  lessThanOrEqualTo?: InputMaybe<Scalars['Datetime']>;
};

/**
 * The result of diffing a `Baseline` with a `Snapshot`.
 *
 * See the documentation for `Baseline` for details how a `Snapshot` is matched to `Baseline`.
 */
export type Diff = Node & {
  __typename?: 'Diff';
  /** Reads a single `Baseline` that is related to this `Diff`. */
  baseline: Maybe<Baseline>;
  baselineId: Maybe<Scalars['UUID']>;
  /** Reads a single `Build` that is related to this `Diff`. */
  build: Maybe<Build>;
  buildId: Scalars['UUID'];
  createdAt: Scalars['Datetime'];
  diffBounds: Maybe<Rect>;
  diffClusters: Array<Maybe<Rect>>;
  diffingMethod: DiffingMethod;
  /** snapshot { uploadId } should be requested at the same moment */
  domDiffUrl: Maybe<Scalars['String']>;
  hasDom: Scalars['Boolean'];
  id: Scalars['UUID'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID'];
  options: Maybe<DiffingOption>;
  preview: Array<Rect>;
  /** Reads a single `Snapshot` that is related to this `Diff`. */
  snapshot: Maybe<Snapshot>;
  snapshotId: Scalars['UUID'];
  status: DiffStatus;
  statusIsEqual: Maybe<Scalars['Boolean']>;
  /**
   * Last time the diff was updated.
   *
   * By default `updatedAt = createdAt`.
   */
  updatedAt: Scalars['Datetime'];
  /** User id of user that last updated the diff. If no user updated the status yet, it is set to `created_by`. */
  updatedBy: Scalars['UUID'];
  updatedByUser: User;
};


/**
 * The result of diffing a `Baseline` with a `Snapshot`.
 *
 * See the documentation for `Baseline` for details how a `Snapshot` is matched to `Baseline`.
 */
export type DiffPreviewArgs = {
  input: DiffPreviewIn;
};

/** A condition to be used against `Diff` object types. All fields are tested for equality and combined with a logical ‘and.’ */
export type DiffCondition = {
  /** Checks for equality with the object’s `baselineId` field. */
  baselineId?: InputMaybe<Scalars['UUID']>;
  /** Checks for equality with the object’s `buildId` field. */
  buildId?: InputMaybe<Scalars['UUID']>;
  /** Checks for equality with the object’s `createdAt` field. */
  createdAt?: InputMaybe<Scalars['Datetime']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']>;
  /** Checks for equality with the object’s `snapshotId` field. */
  snapshotId?: InputMaybe<Scalars['UUID']>;
  /** Checks for equality with the object’s `status` field. */
  status?: InputMaybe<DiffStatus>;
};

export type DiffCountIn = {
  status: DiffStatus;
  /** Set to true to only count diffs that have a baseline. */
  withBaseline?: InputMaybe<Scalars['Boolean']>;
};

/** A filter to be used against `Diff` object types. All fields are combined with a logical ‘and.’ */
export type DiffFilter = {
  /** Filter by the object’s `baselineId` field. */
  baselineId?: InputMaybe<UuidFilter>;
  /** Filter by the object’s `buildId` field. */
  buildId?: InputMaybe<UuidFilter>;
  /** Filter by the object’s `createdAt` field. */
  createdAt?: InputMaybe<DatetimeFilter>;
  /** Filter by the object’s `id` field. */
  id?: InputMaybe<UuidFilter>;
  /** Filter by the object’s `snapshotId` field. */
  snapshotId?: InputMaybe<UuidFilter>;
  /** Filter by the object’s `status` field. */
  status?: InputMaybe<DiffStatusFilter>;
};

export type DiffPreviewIn = {
  ignoreRegions: Array<RegionIn>;
};

/**
 * Lifecycle status of a `Diff`.
 *
 * 1. When a `Diff` is created from a `Snapshot` it will be `QUEUED`.
 * 2. After the difference between snapshot and baseline was computed, the state is either
 *     `EQUAL` (`Baseline` and snapshot are equal) or
 *     `UNAPPROVED` (differences between `Baseline` and `Snapshot` were detected or no `Baseline` exists).
 * 3. A user can update the status of an existing `Diff` to either
 *     `APPROVED` (a new `Baseline` is then created from the `Snapshot`)
 *     `REJECTED` (no new `Baseline` is created)
 *     `UNAPPROVED` (if it was approved before, the previous `Baseline` is restored)
 */
export enum DiffStatus {
  Approved = 'APPROVED',
  Equal = 'EQUAL',
  Errored = 'ERRORED',
  Queued = 'QUEUED',
  Rejected = 'REJECTED',
  Unapproved = 'UNAPPROVED'
}

/** A filter to be used against DiffStatus fields. All fields are combined with a logical ‘and.’ */
export type DiffStatusFilter = {
  /** Greater than the specified value. */
  greaterThan?: InputMaybe<DiffStatus>;
  /** Greater than or equal to the specified value. */
  greaterThanOrEqualTo?: InputMaybe<DiffStatus>;
  /** Included in the specified list. */
  in?: InputMaybe<Array<DiffStatus>>;
  /** Less than the specified value. */
  lessThan?: InputMaybe<DiffStatus>;
  /** Less than or equal to the specified value. */
  lessThanOrEqualTo?: InputMaybe<DiffStatus>;
};

/**
 * Method to use for diffing.
 *
 * SIMPLE is the default.
 */
export enum DiffingMethod {
  Balanced = 'BALANCED',
  Experimental = 'EXPERIMENTAL',
  Simple = 'SIMPLE'
}

export type DiffingOption = {
  __typename?: 'DiffingOption';
  content: Maybe<Scalars['Boolean']>;
  dimensions: Maybe<Scalars['Boolean']>;
  position: Maybe<Scalars['Boolean']>;
  structure: Maybe<Scalars['Boolean']>;
  style: Maybe<Scalars['Boolean']>;
  visual: Maybe<Scalars['Boolean']>;
};

export type DiffingOptionsIn = {
  content?: InputMaybe<Scalars['Boolean']>;
  dimensions?: InputMaybe<Scalars['Boolean']>;
  position?: InputMaybe<Scalars['Boolean']>;
  structure?: InputMaybe<Scalars['Boolean']>;
  style?: InputMaybe<Scalars['Boolean']>;
  visual?: InputMaybe<Scalars['Boolean']>;
};

/** A connection to a list of `Diff` values. */
export type DiffsConnection = {
  __typename?: 'DiffsConnection';
  /** A list of edges which contains the `Diff` and cursor to aid in pagination. */
  edges: Array<DiffsEdge>;
  /** A list of `Diff` objects. */
  nodes: Array<Diff>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `Diff` you could get from the connection. */
  totalCount: Scalars['Int'];
};

/** A `Diff` edge in the connection. */
export type DiffsEdge = {
  __typename?: 'DiffsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']>;
  /** The `Diff` at the end of the edge. */
  node: Diff;
};

/** Methods to use when ordering `Diff`. */
export enum DiffsOrderBy {
  BaselineIdAsc = 'BASELINE_ID_ASC',
  BaselineIdDesc = 'BASELINE_ID_DESC',
  BuildIdAsc = 'BUILD_ID_ASC',
  BuildIdDesc = 'BUILD_ID_DESC',
  CreatedAtAsc = 'CREATED_AT_ASC',
  CreatedAtDesc = 'CREATED_AT_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  SnapshotIdAsc = 'SNAPSHOT_ID_ASC',
  SnapshotIdDesc = 'SNAPSHOT_ID_DESC',
  StatusAsc = 'STATUS_ASC',
  StatusDesc = 'STATUS_DESC',
  StatusIsEqualAsc = 'STATUS_IS_EQUAL_ASC',
  StatusIsEqualDesc = 'STATUS_IS_EQUAL_DESC'
}

export type ElementIn = {
  diffingOptions?: InputMaybe<DiffingOptionsIn>;
  /** The server-assigned ID of an element from webdriver. */
  id: Scalars['WebdriverElementID'];
  name?: InputMaybe<Scalars['String']>;
};

export type FinishBuildIn = {
  customId?: InputMaybe<Scalars['String']>;
  /** Delay the finishing the build for at least the specified number of seconds. */
  delay?: InputMaybe<Scalars['Int']>;
  /** @deprecated Use `uuid`. This field will be removed in a future update. */
  id?: InputMaybe<Scalars['ID']>;
  uuid?: InputMaybe<Scalars['UUID']>;
};

export type ForceFinishBuildIn = {
  customId: Scalars['String'];
};

export type FullPageConfigIn = {
  /** @deprecated this field will be removed soon. */
  addressBarShadowPadding?: InputMaybe<Scalars['Float']>;
  /**
   * Delay in ms after scrolling and before taking screenshots.
   * A slight delay can be helpful if the page is using lazy loading when scrolling
   */
  delayAfterScrollMs?: InputMaybe<Scalars['Int']>;
  /** Disable CSS animations and the input caret in the app. */
  disableCSSAnimation?: InputMaybe<Scalars['Boolean']>;
  /** @deprecated Use hideElementsAfterFirstScroll instead where available. */
  hideAfterFirstScroll?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** Hide elements on the page after first scroll using their server-assigned ID from webdriver. */
  hideElementsAfterFirstScroll?: InputMaybe<Array<Scalars['WebdriverElementID']>>;
  /** Hide all scrollbars in the app. */
  hideScrollBars?: InputMaybe<Scalars['Boolean']>;
  /** @experimental Define custom scrollable element */
  scrollElement?: InputMaybe<Scalars['WebdriverElementID']>;
  /**
   * Limit the number of screenshots taken for scrolling and stitching.
   * Default and max value is 10
   */
  scrollLimit?: InputMaybe<Scalars['Int']>;
  /** @deprecated this field will be removed soon. */
  toolBarShadowPadding?: InputMaybe<Scalars['Int']>;
};

/** A filter to be used against FullText fields. All fields are combined with a logical ‘and.’ */
export type FullTextFilter = {
  /** Performs a full text search on the field. */
  matches?: InputMaybe<Scalars['String']>;
};

/** All input for the `mergeBaselines` mutation. */
export type MergeBaselinesInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']>;
  projectName: Scalars['String'];
  sourceBranch: Scalars['String'];
  targetBranch: Scalars['String'];
};

/** The output of our `mergeBaselines` mutation. */
export type MergeBaselinesPayload = {
  __typename?: 'MergeBaselinesPayload';
  baselines: Maybe<Array<Baseline>>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** The root mutation type which contains root level fields which mutate data. */
export type Mutation = {
  __typename?: 'Mutation';
  approveBuild: Build;
  createBuild: Build;
  /**
   * Copy a set of baselines specified by `baselineIds` and save it as the latest baseline, but
   * replace uiIgnoreRegions with the provided value.
   */
  createDerivedBaselines: Array<Baseline>;
  createSnapshot: Snapshot;
  createSnapshotFromWebDriver: Snapshot;
  createSnapshotUpload: SnapshotUpload;
  finishBuild: Build;
  forceFinishBuild: Maybe<Build>;
  mergeBaselines: MergeBaselinesPayload;
  updateDiff: Diff;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationApproveBuildArgs = {
  input: ApproveBuildIn;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateBuildArgs = {
  input: BuildIn;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateDerivedBaselinesArgs = {
  input: CreateDerivedBaselinesIn;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateSnapshotArgs = {
  input: SnapshotIn;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateSnapshotFromWebDriverArgs = {
  input: CreateSnapshotFromWebDriverIn;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateSnapshotUploadArgs = {
  input: SnapshotUploadIn;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationFinishBuildArgs = {
  input: FinishBuildIn;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationForceFinishBuildArgs = {
  input: ForceFinishBuildIn;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationMergeBaselinesArgs = {
  input: MergeBaselinesInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateDiffArgs = {
  input: UpdateDiffIn;
};

/** An object with a globally unique `ID`. */
export type Node = {
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID'];
};

export enum OperatingSystem {
  Android = 'ANDROID',
  Ios = 'IOS',
  Linux = 'LINUX',
  Macos = 'MACOS',
  Windows = 'WINDOWS'
}

export type Org = {
  __typename?: 'Org';
  id: Maybe<Scalars['UUID']>;
  /** Reads and enables pagination through a set of `OrgStat`. */
  orgStats: OrgStatsConnection;
  statsGroupedByDay: OrgStatsGroupedByDayConnection;
};


export type OrgOrgStatsArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  condition: InputMaybe<OrgStatCondition>;
  filter: InputMaybe<OrgStatFilter>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Array<OrgStatsOrderBy>>;
};


export type OrgStatsGroupedByDayArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
};

export type OrgStat = Node & {
  __typename?: 'OrgStat';
  hour: Scalars['Datetime'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID'];
  /** Reads a single `Org` that is related to this `OrgStat`. */
  org: Maybe<Org>;
  orgId: Scalars['UUID'];
  snapshotsUsed: Scalars['Int'];
};

/** A condition to be used against `OrgStat` object types. All fields are tested for equality and combined with a logical ‘and.’ */
export type OrgStatCondition = {
  /** Checks for equality with the object’s `orgId` field. */
  orgId?: InputMaybe<Scalars['UUID']>;
};

/** A filter to be used against `OrgStat` object types. All fields are combined with a logical ‘and.’ */
export type OrgStatFilter = {
  /** Filter by the object’s `orgId` field. */
  orgId?: InputMaybe<UuidFilter>;
};

/** A connection to a list of `OrgStat` values. */
export type OrgStatsConnection = {
  __typename?: 'OrgStatsConnection';
  /** A list of edges which contains the `OrgStat` and cursor to aid in pagination. */
  edges: Array<OrgStatsEdge>;
  /** A list of `OrgStat` objects. */
  nodes: Array<OrgStat>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `OrgStat` you could get from the connection. */
  totalCount: Scalars['Int'];
};

/** A `OrgStat` edge in the connection. */
export type OrgStatsEdge = {
  __typename?: 'OrgStatsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']>;
  /** The `OrgStat` at the end of the edge. */
  node: OrgStat;
};

/** A connection to a list of `OrgStatsGroupedByDayRecord` values. */
export type OrgStatsGroupedByDayConnection = {
  __typename?: 'OrgStatsGroupedByDayConnection';
  /** A list of edges which contains the `OrgStatsGroupedByDayRecord` and cursor to aid in pagination. */
  edges: Array<OrgStatsGroupedByDayEdge>;
  /** A list of `OrgStatsGroupedByDayRecord` objects. */
  nodes: Array<OrgStatsGroupedByDayRecord>;
  /** The count of *all* `OrgStatsGroupedByDayRecord` you could get from the connection. */
  totalCount: Scalars['Int'];
};

/** A `OrgStatsGroupedByDayRecord` edge in the connection. */
export type OrgStatsGroupedByDayEdge = {
  __typename?: 'OrgStatsGroupedByDayEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']>;
  /** The `OrgStatsGroupedByDayRecord` at the end of the edge. */
  node: OrgStatsGroupedByDayRecord;
};

/** The return type of our `statsGroupedByDay` query. */
export type OrgStatsGroupedByDayRecord = {
  __typename?: 'OrgStatsGroupedByDayRecord';
  day: Maybe<Scalars['Datetime']>;
  snapshotsUsed: Maybe<Scalars['Int']>;
};

/** Methods to use when ordering `OrgStat`. */
export enum OrgStatsOrderBy {
  Natural = 'NATURAL',
  OrgIdAsc = 'ORG_ID_ASC',
  OrgIdAscHourAsc = 'ORG_ID_ASC__HOUR_ASC',
  OrgIdDesc = 'ORG_ID_DESC',
  OrgIdDescHourDesc = 'ORG_ID_DESC__HOUR_DESC',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  endCursor: Maybe<Scalars['Cursor']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean'];
  /** When paginating backwards, the cursor to continue. */
  startCursor: Maybe<Scalars['Cursor']>;
};

export type Project = Node & {
  __typename?: 'Project';
  /** Reads and enables pagination through a set of `Branch`. */
  branches: BranchesConnection;
  lastUsed: Scalars['Datetime'];
  name: Scalars['String'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID'];
};


export type ProjectBranchesArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Array<BranchesOrderBy>>;
};

/** A connection to a list of `Project` values. */
export type ProjectsConnection = {
  __typename?: 'ProjectsConnection';
  /** A list of edges which contains the `Project` and cursor to aid in pagination. */
  edges: Array<ProjectsEdge>;
  /** A list of `Project` objects. */
  nodes: Array<Project>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `Project` you could get from the connection. */
  totalCount: Scalars['Int'];
};

/** A `Project` edge in the connection. */
export type ProjectsEdge = {
  __typename?: 'ProjectsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']>;
  /** The `Project` at the end of the edge. */
  node: Project;
};

/** Methods to use when ordering `Project`. */
export enum ProjectsOrderBy {
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** The root query type which gives access points into the data universe. */
export type Query = Node & {
  __typename?: 'Query';
  baseline: Maybe<Baseline>;
  /** Reads a single `Baseline` using its globally unique `ID`. */
  baselineByNodeId: Maybe<Baseline>;
  /** Reads and enables pagination through a set of `Baseline`. */
  baselines: Maybe<BaselinesConnection>;
  branch: Maybe<Branch>;
  /** Reads a single `Branch` using its globally unique `ID`. */
  branchByNodeId: Maybe<Branch>;
  /** Reads and enables pagination through a set of `Branch`. */
  branches: Maybe<BranchesConnection>;
  build: Maybe<Build>;
  buildByCustomId: Maybe<Build>;
  /** Reads a single `Build` using its globally unique `ID`. */
  buildByNodeId: Maybe<Build>;
  /** Reads and enables pagination through a set of `Build`. */
  builds: Maybe<BuildsConnection>;
  diff: Maybe<Diff>;
  /** Reads a single `Diff` using its globally unique `ID`. */
  diffByNodeId: Maybe<Diff>;
  /** Reads and enables pagination through a set of `Diff`. */
  diffs: Maybe<DiffsConnection>;
  /**
   * List all the build branches that are visible to the current user and that include `filtername`.
   *
   * Results are limited to 100 entries.
   */
  filteredBranches: Array<Scalars['String']>;
  /**
   * List all the build projects that are visible to the current user and that include `filtername`.
   *
   * Results are limited to 100 entries.
   */
  filteredProjects: Array<Scalars['String']>;
  jwtOrgId: Maybe<Scalars['UUID']>;
  jwtTeamId: Maybe<Scalars['UUID']>;
  jwtUserId: Maybe<Scalars['UUID']>;
  /** Reads and enables pagination through a set of `Baseline`. */
  latestBaselines: BaselinesConnection;
  /** Fetches an object given its globally unique `ID`. */
  node: Maybe<Node>;
  /** The root query type must be a `Node` to work well with Relay 1 mutations. This just resolves to `query`. */
  nodeId: Scalars['ID'];
  org: Maybe<Org>;
  orgStat: Maybe<OrgStat>;
  /** Reads a single `OrgStat` using its globally unique `ID`. */
  orgStatByNodeId: Maybe<OrgStat>;
  project: Maybe<Project>;
  /** Reads a single `Project` using its globally unique `ID`. */
  projectByNodeId: Maybe<Project>;
  /** Reads and enables pagination through a set of `Project`. */
  projects: Maybe<ProjectsConnection>;
  /**
   * Exposes the root query type nested one level down. This is helpful for Relay 1
   * which can only query top level fields if they are in a particular form.
   */
  query: Query;
  snapshot: Maybe<Snapshot>;
  /** Reads a single `Snapshot` using its globally unique `ID`. */
  snapshotByNodeId: Maybe<Snapshot>;
  /** Reads and enables pagination through a set of `Snapshot`. */
  snapshots: Maybe<SnapshotsConnection>;
  webdriverSessionInfo: Maybe<WebdriverSession>;
};


/** The root query type which gives access points into the data universe. */
export type QueryBaselineArgs = {
  id: Scalars['UUID'];
};


/** The root query type which gives access points into the data universe. */
export type QueryBaselineByNodeIdArgs = {
  nodeId: Scalars['ID'];
};


/** The root query type which gives access points into the data universe. */
export type QueryBaselinesArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  condition: InputMaybe<BaselineCondition>;
  filter: InputMaybe<BaselineFilter>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Array<BaselinesOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryBranchArgs = {
  name: Scalars['String'];
  projectName: Scalars['String'];
};


/** The root query type which gives access points into the data universe. */
export type QueryBranchByNodeIdArgs = {
  nodeId: Scalars['ID'];
};


/** The root query type which gives access points into the data universe. */
export type QueryBranchesArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Array<BranchesOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryBuildArgs = {
  id: Scalars['UUID'];
};


/** The root query type which gives access points into the data universe. */
export type QueryBuildByCustomIdArgs = {
  customId: Scalars['String'];
};


/** The root query type which gives access points into the data universe. */
export type QueryBuildByNodeIdArgs = {
  nodeId: Scalars['ID'];
};


/** The root query type which gives access points into the data universe. */
export type QueryBuildsArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  condition: InputMaybe<BuildCondition>;
  filter: InputMaybe<BuildFilter>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Array<BuildsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryDiffArgs = {
  id: Scalars['UUID'];
};


/** The root query type which gives access points into the data universe. */
export type QueryDiffByNodeIdArgs = {
  nodeId: Scalars['ID'];
};


/** The root query type which gives access points into the data universe. */
export type QueryDiffsArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  condition: InputMaybe<DiffCondition>;
  filter: InputMaybe<DiffFilter>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Array<DiffsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryFilteredBranchesArgs = {
  filtername: InputMaybe<Scalars['String']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryFilteredProjectsArgs = {
  filtername: InputMaybe<Scalars['String']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryLatestBaselinesArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  branchName: Scalars['String'];
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  projectName: Scalars['String'];
};


/** The root query type which gives access points into the data universe. */
export type QueryNodeArgs = {
  nodeId: Scalars['ID'];
};


/** The root query type which gives access points into the data universe. */
export type QueryOrgStatArgs = {
  hour: Scalars['Datetime'];
  orgId: Scalars['UUID'];
};


/** The root query type which gives access points into the data universe. */
export type QueryOrgStatByNodeIdArgs = {
  nodeId: Scalars['ID'];
};


/** The root query type which gives access points into the data universe. */
export type QueryProjectArgs = {
  name: Scalars['String'];
};


/** The root query type which gives access points into the data universe. */
export type QueryProjectByNodeIdArgs = {
  nodeId: Scalars['ID'];
};


/** The root query type which gives access points into the data universe. */
export type QueryProjectsArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Array<ProjectsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QuerySnapshotArgs = {
  id: Scalars['UUID'];
};


/** The root query type which gives access points into the data universe. */
export type QuerySnapshotByNodeIdArgs = {
  nodeId: Scalars['ID'];
};


/** The root query type which gives access points into the data universe. */
export type QuerySnapshotsArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  condition: InputMaybe<SnapshotCondition>;
  filter: InputMaybe<SnapshotFilter>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Array<SnapshotsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryWebdriverSessionInfoArgs = {
  input: WebdriverSessionInfoIn;
};

export type Rect = {
  __typename?: 'Rect';
  flags: Maybe<DiffingOption>;
  height: Scalars['Int'];
  width: Scalars['Int'];
  x: Scalars['Int'];
  y: Scalars['Int'];
};

export type Region = {
  __typename?: 'Region';
  diffingOptions: Maybe<DiffingOption>;
  height: Scalars['Int'];
  name: Maybe<Scalars['String']>;
  width: Scalars['Int'];
  x: Scalars['Int'];
  y: Scalars['Int'];
};

export type RegionIn = {
  diffingOptions?: InputMaybe<DiffingOptionsIn>;
  height: Scalars['Int'];
  name?: InputMaybe<Scalars['String']>;
  width: Scalars['Int'];
  x: Scalars['Int'];
  y: Scalars['Int'];
};

export type Snapshot = Node & {
  __typename?: 'Snapshot';
  appId: Maybe<Scalars['String']>;
  appName: Maybe<Scalars['String']>;
  appVersion: Maybe<Scalars['String']>;
  /** Reads and enables pagination through a set of `Baseline`. */
  baselines: BaselinesConnection;
  branch: Maybe<Scalars['String']>;
  browser: Maybe<Browser>;
  browserVersion: Maybe<Scalars['String']>;
  /** Reads a single `Build` that is related to this `Snapshot`. */
  build: Maybe<Build>;
  buildId: Scalars['UUID'];
  createdAt: Scalars['Datetime'];
  defaultBranch: Maybe<Scalars['String']>;
  device: Maybe<Scalars['String']>;
  devicePixelRatio: Scalars['Float'];
  /** Reads and enables pagination through a set of `Diff`. */
  diffs: DiffsConnection;
  domDiffUrl: Maybe<Scalars['String']>;
  /**
   * If not null, it indicates that the snapshot is invalid.
   *
   * By convention, the following errors exist:
   * - `{"code": "TRUNCATED"}`: The image file is corrupt and was probably truncated.
   * - `{"code": "IMAGE_TOO_LARGE"}`: The image file exceeds the resolution / filesize limits for the diffing service.
   * - `{"code": "INVALID"}`: The image file is invalid or in an unsupported image format.
   * - `{"domCode": "DOM_TOO_LARGE"}`: [WARNING] The uploaded DOM is too large.
   * - `{"domCode": "DOM_CAPTURE_FAILED"}`: [WARNING] A DOM snapshot was requested, but could not be captured.
   * - `{"domCode": "DOM_INVALID"}`: [WARNING] The DOM snapshot has an invalid structure.
   *
   * Other error types may exist and the frontend should display a generic error message
   * together with the JSON contents of `error`.
   */
  error: Maybe<Scalars['JSON']>;
  hasDom: Scalars['Boolean'];
  /** `height` is determined asynchronously and may be null right after snapshot creation. */
  height: Maybe<Scalars['Int']>;
  id: Scalars['UUID'];
  ignoreRegions: Array<Maybe<Region>>;
  imageUrl: Scalars['String'];
  /** URL that is used by the frontend to link to the job, task or process that has generated this snapshot. For exemple, a link to a Sauce Session. */
  jobUrl: Maybe<Scalars['String']>;
  latestBaseline: Maybe<Baseline>;
  metadata: Maybe<Scalars['JSON']>;
  name: Scalars['String'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID'];
  operatingSystem: Maybe<OperatingSystem>;
  operatingSystemVersion: Maybe<Scalars['String']>;
  suiteName: Maybe<Scalars['String']>;
  testName: Maybe<Scalars['String']>;
  thumbnailUrl: Scalars['String'];
  uploadId: Scalars['String'];
  url: Scalars['String'];
  viewportHeight: Maybe<Scalars['Int']>;
  viewportWidth: Maybe<Scalars['Int']>;
  /** `width` is determined asynchronously and may be null right after snapshot creation. */
  width: Maybe<Scalars['Int']>;
};


export type SnapshotBaselinesArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  condition: InputMaybe<BaselineCondition>;
  filter: InputMaybe<BaselineFilter>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Array<BaselinesOrderBy>>;
};


export type SnapshotDiffsArgs = {
  after: InputMaybe<Scalars['Cursor']>;
  before: InputMaybe<Scalars['Cursor']>;
  condition: InputMaybe<DiffCondition>;
  filter: InputMaybe<DiffFilter>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
  offset: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Array<DiffsOrderBy>>;
};

/**
 * A condition to be used against `Snapshot` object types. All fields are tested
 * for equality and combined with a logical ‘and.’
 */
export type SnapshotCondition = {
  /** Checks for equality with the object’s `buildId` field. */
  buildId?: InputMaybe<Scalars['UUID']>;
  /** Checks for equality with the object’s `createdAt` field. */
  createdAt?: InputMaybe<Scalars['Datetime']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']>;
};

/** A filter to be used against `Snapshot` object types. All fields are combined with a logical ‘and.’ */
export type SnapshotFilter = {
  /** Filter by the object’s `buildId` field. */
  buildId?: InputMaybe<UuidFilter>;
  /** Filter by the object’s `createdAt` field. */
  createdAt?: InputMaybe<DatetimeFilter>;
  /** Filter by the object’s `id` field. */
  id?: InputMaybe<UuidFilter>;
};

export type SnapshotIn = {
  appId?: InputMaybe<Scalars['String']>;
  appName?: InputMaybe<Scalars['String']>;
  appVersion?: InputMaybe<Scalars['String']>;
  /**
   * One or more overrides for locating the matching baseline. Can be used for cross browser / OS
   * visual testing.
   */
  baselineOverride?: InputMaybe<BaselineOverrideIn>;
  browser?: InputMaybe<Browser>;
  browserVersion?: InputMaybe<Scalars['String']>;
  /** @deprecated Use `buildUuid`. This field will be removed in a future update. */
  buildId?: InputMaybe<Scalars['ID']>;
  buildUuid?: InputMaybe<Scalars['UUID']>;
  device?: InputMaybe<Scalars['String']>;
  devicePixelRatio?: InputMaybe<Scalars['Float']>;
  diffingMethod?: InputMaybe<DiffingMethod>;
  diffingOptions?: InputMaybe<DiffingOptionsIn>;
  ignoreRegions?: InputMaybe<Array<RegionIn>>;
  jobUrl?: InputMaybe<Scalars['String']>;
  metadata?: InputMaybe<Scalars['JSON']>;
  name: Scalars['String'];
  operatingSystem?: InputMaybe<OperatingSystem>;
  operatingSystemVersion?: InputMaybe<Scalars['String']>;
  suiteName?: InputMaybe<Scalars['String']>;
  testName?: InputMaybe<Scalars['String']>;
  /** @deprecated Use `uploadUuid`. This field will be removed in a future update. */
  uploadId?: InputMaybe<Scalars['ID']>;
  uploadUuid?: InputMaybe<Scalars['UUID']>;
};

export type SnapshotUpload = {
  __typename?: 'SnapshotUpload';
  buildId: Scalars['UUID'];
  domUploadUrl: Maybe<Scalars['String']>;
  id: Scalars['UUID'];
  imageUploadUrl: Maybe<Scalars['String']>;
  /** @deprecated Use imageUploadUrl. */
  uploadUrl: Scalars['String'];
};

export type SnapshotUploadIn = {
  /** @deprecated Use `buildUuid`. This field will be removed in a future update. */
  buildId?: InputMaybe<Scalars['ID']>;
  buildUuid?: InputMaybe<Scalars['UUID']>;
};

/** A connection to a list of `Snapshot` values. */
export type SnapshotsConnection = {
  __typename?: 'SnapshotsConnection';
  /** A list of edges which contains the `Snapshot` and cursor to aid in pagination. */
  edges: Array<SnapshotsEdge>;
  /** A list of `Snapshot` objects. */
  nodes: Array<Snapshot>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `Snapshot` you could get from the connection. */
  totalCount: Scalars['Int'];
};

/** A `Snapshot` edge in the connection. */
export type SnapshotsEdge = {
  __typename?: 'SnapshotsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']>;
  /** The `Snapshot` at the end of the edge. */
  node: Snapshot;
};

/** Methods to use when ordering `Snapshot`. */
export enum SnapshotsOrderBy {
  BuildIdAsc = 'BUILD_ID_ASC',
  BuildIdDesc = 'BUILD_ID_DESC',
  CreatedAtAsc = 'CREATED_AT_ASC',
  CreatedAtDesc = 'CREATED_AT_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** A filter to be used against String fields. All fields are combined with a logical ‘and.’ */
export type StringFilter = {
  /** Greater than the specified value. */
  greaterThan?: InputMaybe<Scalars['String']>;
  /** Greater than or equal to the specified value. */
  greaterThanOrEqualTo?: InputMaybe<Scalars['String']>;
  /** Included in the specified list. */
  in?: InputMaybe<Array<Scalars['String']>>;
  /** Less than the specified value. */
  lessThan?: InputMaybe<Scalars['String']>;
  /** Less than or equal to the specified value. */
  lessThanOrEqualTo?: InputMaybe<Scalars['String']>;
};

/** A filter to be used against UUID fields. All fields are combined with a logical ‘and.’ */
export type UuidFilter = {
  /** Greater than the specified value. */
  greaterThan?: InputMaybe<Scalars['UUID']>;
  /** Greater than or equal to the specified value. */
  greaterThanOrEqualTo?: InputMaybe<Scalars['UUID']>;
  /** Included in the specified list. */
  in?: InputMaybe<Array<Scalars['UUID']>>;
  /** Less than the specified value. */
  lessThan?: InputMaybe<Scalars['UUID']>;
  /** Less than or equal to the specified value. */
  lessThanOrEqualTo?: InputMaybe<Scalars['UUID']>;
};

export type UpdateDiffIn = {
  /** @deprecated Use `uuid`. This field will be removed in a future update. */
  id?: InputMaybe<Scalars['ID']>;
  status: UpdateDiffStatus;
  uuid?: InputMaybe<Scalars['UUID']>;
};

/** See DiffStatus for details. */
export enum UpdateDiffStatus {
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Unapproved = 'UNAPPROVED'
}

export type User = {
  __typename?: 'User';
  id: Scalars['UUID'];
  username: Maybe<Scalars['String']>;
};

export type WebdriverSession = {
  __typename?: 'WebdriverSession';
  applicationSummary: Maybe<ApplicationSummary>;
  /** Encodes all metadata in an opaque scalar that can be passed to `CreateSnapshotFromWebDriver`. */
  blob: Scalars['WebdriverSessionBlob'];
  browser: Maybe<Browser>;
  browserVersion: Maybe<Scalars['String']>;
  deviceDpr: Maybe<Scalars['Float']>;
  deviceName: Maybe<Scalars['String']>;
  operatingSystem: Maybe<OperatingSystem>;
  operatingSystemVersion: Maybe<Scalars['String']>;
};

export type WebdriverSessionInfoIn = {
  jobId: Scalars['ID'];
  sessionId: Scalars['ID'];
};

export type BuildQueryVariables = Exact<{
  input: Scalars['UUID'];
}>;


export type BuildQuery = { __typename?: 'Query', result: { __typename?: 'Build', id: string, name: string, url: string, status: BuildStatus, project: string | null, branch: string | null, defaultBranch: string | null, mode: BuildMode } | null };

export type BuildByCustomIdQueryVariables = Exact<{
  input: Scalars['String'];
}>;


export type BuildByCustomIdQuery = { __typename?: 'Query', result: { __typename?: 'Build', id: string, name: string, url: string, status: BuildStatus, project: string | null, branch: string | null, mode: BuildMode } | null };

export type BuildStatusQueryVariables = Exact<{
  input: Scalars['UUID'];
}>;


export type BuildStatusQuery = { __typename?: 'Query', result: { __typename?: 'Build', url: string, status: BuildStatus, unapprovedCount: number, errorCount: number } | null };

export type BuildWithDiffsQueryVariables = Exact<{
  input: Scalars['UUID'];
}>;


export type BuildWithDiffsQuery = { __typename?: 'Query', result: { __typename?: 'Build', id: string, name: string, url: string, status: BuildStatus, project: string | null, branch: string | null, diffs: { __typename?: 'DiffsConnection', nodes: Array<{ __typename?: 'Diff', id: string, baselineId: string | null, status: DiffStatus, baseline: { __typename?: 'Baseline', snapshot: { __typename?: 'Snapshot', buildId: string } | null } | null, diffBounds: { __typename?: 'Rect', x: number, y: number } | null, diffClusters: Array<{ __typename?: 'Rect', x: number, y: number, width: number, height: number } | null> }> } } | null };

export type BuildWithDiffsByCustomIdQueryVariables = Exact<{
  input: Scalars['String'];
}>;


export type BuildWithDiffsByCustomIdQuery = { __typename?: 'Query', result: { __typename?: 'Build', id: string, name: string, url: string, status: BuildStatus, project: string | null, branch: string | null, diffs: { __typename?: 'DiffsConnection', nodes: Array<{ __typename?: 'Diff', id: string, baselineId: string | null, status: DiffStatus, baseline: { __typename?: 'Baseline', snapshot: { __typename?: 'Snapshot', buildId: string } | null } | null, diffBounds: { __typename?: 'Rect', x: number, y: number } | null, diffClusters: Array<{ __typename?: 'Rect', x: number, y: number } | null> }> } } | null };

export type CreateBuildMutationVariables = Exact<{
  input: BuildIn;
}>;


export type CreateBuildMutation = { __typename?: 'Mutation', result: { __typename?: 'Build', id: string, name: string, project: string | null, branch: string | null, defaultBranch: string | null, status: BuildStatus, url: string } };

export type CreateSnapshotMutationVariables = Exact<{
  input: SnapshotIn;
}>;


export type CreateSnapshotMutation = { __typename?: 'Mutation', result: { __typename?: 'Snapshot', id: string, uploadId: string, diffs: { __typename?: 'DiffsConnection', nodes: Array<{ __typename?: 'Diff', id: string, baselineId: string | null, snapshotId: string, status: DiffStatus, diffBounds: { __typename?: 'Rect', x: number, y: number, width: number, height: number } | null, diffClusters: Array<{ __typename?: 'Rect', x: number, y: number, width: number, height: number } | null> }> } } };

export type CreateSnapshotFromWebDriverMutationVariables = Exact<{
  input: CreateSnapshotFromWebDriverIn;
}>;


export type CreateSnapshotFromWebDriverMutation = { __typename?: 'Mutation', result: { __typename?: 'Snapshot', id: string, uploadId: string, diffs: { __typename?: 'DiffsConnection', nodes: Array<{ __typename?: 'Diff', id: string, baselineId: string | null, snapshotId: string, status: DiffStatus, diffBounds: { __typename?: 'Rect', x: number, y: number, width: number, height: number } | null, diffClusters: Array<{ __typename?: 'Rect', x: number, y: number, width: number, height: number } | null> }> } } };

export type CreateSnapshotUploadMutationVariables = Exact<{
  input: SnapshotUploadIn;
}>;


export type CreateSnapshotUploadMutation = { __typename?: 'Mutation', result: { __typename?: 'SnapshotUpload', id: string, buildId: string, imageUploadUrl: string | null, domUploadUrl: string | null } };

export type DiffsForTestResultQueryVariables = Exact<{
  input: Scalars['UUID'];
}>;


export type DiffsForTestResultQuery = { __typename?: 'Query', result: { __typename?: 'DiffsConnection', nodes: Array<{ __typename?: 'Diff', id: string, status: DiffStatus }> } | null };

export type FinishBuildDocumentMutationVariables = Exact<{
  input: FinishBuildIn;
}>;


export type FinishBuildDocumentMutation = { __typename?: 'Mutation', result: { __typename?: 'Build', id: string, name: string, status: BuildStatus, url: string } };

export type MergeBaselinesMutationVariables = Exact<{
  input: MergeBaselinesInput;
}>;


export type MergeBaselinesMutation = { __typename?: 'Mutation', result: { __typename?: 'MergeBaselinesPayload', baselines: Array<{ __typename?: 'Baseline', id: string }> | null } };

export type UpdateDiffMutationVariables = Exact<{
  input: UpdateDiffIn;
}>;


export type UpdateDiffMutation = { __typename?: 'Mutation', result: { __typename?: 'Diff', id: string, status: DiffStatus, baselineId: string | null, snapshotId: string } };

export type WebdriverSessionInfoQueryVariables = Exact<{
  input: WebdriverSessionInfoIn;
}>;


export type WebdriverSessionInfoQuery = { __typename?: 'Query', result: { __typename?: 'WebdriverSession', blob: string, operatingSystem: OperatingSystem | null, operatingSystemVersion: string | null, browser: Browser | null, browserVersion: string | null, deviceName: string | null } | null };


export const BuildDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"build"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"build"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"project"}},{"kind":"Field","name":{"kind":"Name","value":"branch"}},{"kind":"Field","name":{"kind":"Name","value":"defaultBranch"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}}]}}]}}]} as unknown as DocumentNode<BuildQuery, BuildQueryVariables>;
export const BuildByCustomIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"buildByCustomId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"buildByCustomId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"customId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"project"}},{"kind":"Field","name":{"kind":"Name","value":"branch"}},{"kind":"Field","name":{"kind":"Name","value":"mode"}}]}}]}}]} as unknown as DocumentNode<BuildByCustomIdQuery, BuildByCustomIdQueryVariables>;
export const BuildStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"buildStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"build"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","alias":{"kind":"Name","value":"unapprovedCount"},"name":{"kind":"Name","value":"diffCountExtended"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"UNAPPROVED"}}]}}]},{"kind":"Field","alias":{"kind":"Name","value":"errorCount"},"name":{"kind":"Name","value":"diffCountExtended"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"ERRORED"}}]}}]}]}}]}}]} as unknown as DocumentNode<BuildStatusQuery, BuildStatusQueryVariables>;
export const BuildWithDiffsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"buildWithDiffs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"build"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"project"}},{"kind":"Field","name":{"kind":"Name","value":"branch"}},{"kind":"Field","name":{"kind":"Name","value":"diffs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"baselineId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"baseline"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"snapshot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"buildId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"diffBounds"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"diffClusters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<BuildWithDiffsQuery, BuildWithDiffsQueryVariables>;
export const BuildWithDiffsByCustomIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"buildWithDiffsByCustomId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"buildByCustomId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"customId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"project"}},{"kind":"Field","name":{"kind":"Name","value":"branch"}},{"kind":"Field","name":{"kind":"Name","value":"diffs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"baselineId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"baseline"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"snapshot"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"buildId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"diffBounds"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}},{"kind":"Field","name":{"kind":"Name","value":"diffClusters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<BuildWithDiffsByCustomIdQuery, BuildWithDiffsByCustomIdQueryVariables>;
export const CreateBuildDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createBuild"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BuildIn"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"createBuild"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"project"}},{"kind":"Field","name":{"kind":"Name","value":"branch"}},{"kind":"Field","name":{"kind":"Name","value":"defaultBranch"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<CreateBuildMutation, CreateBuildMutationVariables>;
export const CreateSnapshotDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createSnapshot"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SnapshotIn"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"createSnapshot"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"uploadId"}},{"kind":"Field","name":{"kind":"Name","value":"diffs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"baselineId"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"diffBounds"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}},{"kind":"Field","name":{"kind":"Name","value":"diffClusters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateSnapshotMutation, CreateSnapshotMutationVariables>;
export const CreateSnapshotFromWebDriverDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createSnapshotFromWebDriver"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSnapshotFromWebDriverIn"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"createSnapshotFromWebDriver"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"uploadId"}},{"kind":"Field","name":{"kind":"Name","value":"diffs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"baselineId"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"diffBounds"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}},{"kind":"Field","name":{"kind":"Name","value":"diffClusters"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateSnapshotFromWebDriverMutation, CreateSnapshotFromWebDriverMutationVariables>;
export const CreateSnapshotUploadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createSnapshotUpload"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SnapshotUploadIn"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"createSnapshotUpload"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buildId"}},{"kind":"Field","name":{"kind":"Name","value":"imageUploadUrl"}},{"kind":"Field","name":{"kind":"Name","value":"domUploadUrl"}}]}}]}}]} as unknown as DocumentNode<CreateSnapshotUploadMutation, CreateSnapshotUploadMutationVariables>;
export const DiffsForTestResultDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"diffsForTestResult"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"diffs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"buildId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<DiffsForTestResultQuery, DiffsForTestResultQueryVariables>;
export const FinishBuildDocumentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FinishBuildDocument"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FinishBuildIn"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"finishBuild"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<FinishBuildDocumentMutation, FinishBuildDocumentMutationVariables>;
export const MergeBaselinesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"mergeBaselines"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MergeBaselinesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"mergeBaselines"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"baselines"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<MergeBaselinesMutation, MergeBaselinesMutationVariables>;
export const UpdateDiffDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDiff"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDiffIn"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"updateDiff"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"baselineId"}},{"kind":"Field","name":{"kind":"Name","value":"snapshotId"}}]}}]}}]} as unknown as DocumentNode<UpdateDiffMutation, UpdateDiffMutationVariables>;
export const WebdriverSessionInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"webdriverSessionInfo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WebdriverSessionInfoIn"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"webdriverSessionInfo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"blob"}},{"kind":"Field","name":{"kind":"Name","value":"operatingSystem"}},{"kind":"Field","name":{"kind":"Name","value":"operatingSystemVersion"}},{"kind":"Field","name":{"kind":"Name","value":"browser"}},{"kind":"Field","name":{"kind":"Name","value":"browserVersion"}},{"kind":"Field","name":{"kind":"Name","value":"deviceName"}}]}}]}}]} as unknown as DocumentNode<WebdriverSessionInfoQuery, WebdriverSessionInfoQueryVariables>;