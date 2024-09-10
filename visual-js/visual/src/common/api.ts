import fs from 'fs';
import fetch from 'node-fetch';
import crypto from 'crypto';
import { ProxyAgent } from 'proxy-agent';
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  FetchResult,
  TypedDocumentNode,
  DefaultOptions,
  ApolloError,
  ServerError,
  HttpLink,
  HttpOptions,
} from '@apollo/client/core/index.js';
import { setContext } from '@apollo/client/link/context/index.js';
import { ResultOf, VariablesOf } from '@graphql-typed-document-node/core';
import {
  BuildDocument,
  BuildWithDiffsDocument,
  BuildStatusDocument,
  CreateBuildDocument,
  CreateSnapshotDocument,
  CreateSnapshotFromWebDriverDocument,
  CreateSnapshotUploadDocument,
  DiffsForTestResultDocument,
  FinishBuildDocumentDocument,
  UpdateDiffDocument,
  WebdriverSessionInfoDocument,
  BuildWithDiffsByCustomIdDocument,
  BuildByCustomIdDocument,
  MergeBaselinesDocument,
} from '../graphql/__generated__/graphql.js';
import {
  SauceRegion,
  VisualApiRegion,
  resolveRegionFromOndemandHostname,
} from './regions.js';

export * from '../graphql/__generated__/graphql.js';
export * from './selective-region.js';

const clientVersion = 'PKG_VERSION';

export type VisualApi = ReturnType<typeof getApi>;

const fetchOptions = { agent: new ProxyAgent() };

export const getApi = (
  config: VisualConfig,
  options?: {
    userAgent?: string;
  },
) => {
  const { user, key } = config;

  const { apiUrl } = getApiUrl(config);

  if (!user || !key) {
    throw new Error(
      'Sauce Labs credentials not set. Please check that you set correctly your `user` and `key`.',
    );
  }

  const httpLink = new HttpLink({
    uri: apiUrl,
    headers: {
      'User-Agent': options?.userAgent || `visual-js/${clientVersion}`,
    },
    fetch: fetch as unknown as HttpOptions['fetch'], // types aren't fully compatible
    fetchOptions,
  });
  const link = user && key ? authLink(user, key).concat(httpLink) : httpLink;

  const defaultOptions: DefaultOptions = {
    query: {
      fetchPolicy: 'no-cache',
    },
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    mutate: {
      fetchPolicy: 'no-cache',
    },
  };

  const apolloOptions = {
    apiUrl,
    cache: new InMemoryCache(),
    link,
    defaultOptions,
  };

  const staticBaseUrl = new URL(`${apiUrl}/../static/`).toString();

  const apollo = new ApolloClient(apolloOptions);

  return {
    domCaptureScript: domCaptureScript(user, key, staticBaseUrl),
    client: apollo,
    createBuild: makeQuery(apollo, CreateBuildDocument),
    createSnapshot: makeQuery(apollo, CreateSnapshotDocument),
    createSnapshotUpload: makeQuery(apollo, CreateSnapshotUploadDocument),
    finishBuild: makeQuery(apollo, FinishBuildDocumentDocument),
    mergeBaselines: makeQuery(apollo, MergeBaselinesDocument),
    createSnapshotFromWebDriver: makeQuery(
      apollo,
      CreateSnapshotFromWebDriverDocument,
    ),
    webdriverSessionInfo: makeQuery(apollo, WebdriverSessionInfoDocument),
    build: makeQuery(apollo, BuildDocument),
    buildByCustomId: makeQuery(apollo, BuildByCustomIdDocument),
    buildWithDiffs: makeQuery(apollo, BuildWithDiffsDocument),
    buildWithDiffsByCustomId: makeQuery(
      apollo,
      BuildWithDiffsByCustomIdDocument,
    ),
    buildStatus: makeQuery(apollo, BuildStatusDocument),

    updateDiff: makeQuery(apollo, UpdateDiffDocument),
    diffsForTestResult: makeQuery(apollo, DiffsForTestResultDocument),

    /**
     * @deprecated Use uploadSnapshot
     */
    upload: makeUpload(apollo),
    uploadSnapshot: makeUploadSnapshot(apollo),
  };
};

type ImagePath = { buildId: string; path: string };
type ImageData = { buildId: string; image: Buffer };

type DataContent = { data: Buffer };
type DataPath = { path: string };

function isImagePath(input: ImageData | ImagePath): input is ImagePath {
  return 'path' in input;
}

function isDataPath(input: DataContent | DataPath): input is DataPath {
  return 'path' in input;
}

const uploadToUrl = async ({
  uploadUrl,
  contentType,
  file,
  compress,
  uploadTimeoutMs,
}: {
  uploadUrl: string;
  contentType: string;
  file: DataContent | DataPath;
  compress?: boolean;
  uploadTimeoutMs?: number;
}) => {
  const uploadBody = isDataPath(file) ? fs.readFileSync(file.path) : file.data;

  const hash = crypto.createHash('md5').update(uploadBody).digest('base64');
  try {
    uploadTimeoutMs ||= 10_000;
    const result = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': `${uploadBody.byteLength}`,
        'Content-Type': contentType,
        'Content-MD5': hash,
      },
      body: uploadBody,
      compress,
      ...fetchOptions,
      signal: AbortSignal.timeout(uploadTimeoutMs),
    });

    if (!result.ok) {
      throw new Error(`Failed to upload snapshot: ${result.statusText}`);
    }
  } catch (ex: unknown) {
    const isObject = (value: unknown): value is any =>
      !!value && typeof value === 'object';
    if (isObject(ex)) {
      if (ex?.name === 'AbortError') {
        console.error();
        throw new Error(`Uploading snapshot reached timeout.
Please check that you have connectivity and are able to do HTTP PUT requests.
URL: ${uploadUrl}
Note: This URL is valid only for a couple of minutes`);
      }
    }
    throw new Error(`Upload failed with an unknown error: ${ex}`);
  }
};

const makeUploadSnapshot =
  (apollo: ApolloClient<NormalizedCacheObject>) =>
  async ({
    buildId,
    image,
    dom,
  }: {
    buildId: string;
    image?: DataContent | DataPath;
    dom?: DataContent | DataPath;
  }) => {
    const {
      id: uploadId,
      imageUploadUrl,
      domUploadUrl,
    } = await genericQuery(apollo, CreateSnapshotUploadDocument, {
      buildUuid: buildId,
    });

    if (image) {
      await uploadToUrl({
        uploadUrl: imageUploadUrl,
        contentType: 'image/png',
        file: image,
      });
    }

    if (dom) {
      await uploadToUrl({
        uploadUrl: domUploadUrl,
        compress: true,
        contentType: 'text/html',
        file: dom,
      });
    }
    return uploadId;
  };

const makeUpload =
  (apollo: ApolloClient<NormalizedCacheObject>) =>
  async (input: ImagePath | ImageData): Promise<string> => {
    const { buildId } = input;

    const content: DataContent | DataPath = isImagePath(input)
      ? input
      : { data: input.image };
    return makeUploadSnapshot(apollo)({
      buildId: buildId,
      image: content,
    });
  };

async function genericQuery<
  Result extends { result: any },
  Input,
  Doc extends TypedDocumentNode<Result, { input: Input }>,
>(
  apollo: ApolloClient<NormalizedCacheObject>,
  doc: Doc,
  input: VariablesOf<Doc>['input'],
): Promise<Result['result']> {
  const variables = { input };

  let result;
  try {
    result =
      'mutation' === (doc as any).definitions[0].operation
        ? await apollo.mutate({ mutation: doc, variables })
        : await apollo.query({ query: doc, variables });
  } catch (e: unknown) {
    throw ensureError(e);
  }
  return checkResult(result).result;
}

function makeQuery<
  Doc extends TypedDocumentNode<{ result: Result }, { input: Input }>,
  Result = ResultOf<Doc>['result'],
  Input = VariablesOf<Doc>['input'],
>(
  apollo: ApolloClient<NormalizedCacheObject>,
  doc: Doc,
): (input: Input) => Promise<Result> {
  return async (input: Input) => await genericQuery(apollo, doc, input);
}

export interface VisualConfig {
  region?: SauceRegion | VisualApiRegion;
  protocol?: string;
  hostname?: string;
  port?: number;
  user?: string;
  key?: string;

  /** Don't use. For internal testing only */
  apiUrl?: string;
}

const getApiUrl = ({
  region,
  hostname,
  apiUrl,
}: {
  region?: SauceRegion | VisualApiRegion;
  hostname?: string;
  apiUrl?: string;
}): { apiUrl: string } => {
  // Allow specifying a raw apiUrl for internal testing
  if (apiUrl) return { apiUrl };

  if (region instanceof VisualApiRegion) {
    return {
      apiUrl: region.graphqlEndpoint,
    };
  }

  hostname ||= '';
  const effectiveRegion = region || resolveRegionFromOndemandHostname(hostname);

  if (!effectiveRegion) {
    throw new Error(`${hostname} is not recognised as a Sauce Labs region.`);
  }

  const apiRegion = VisualApiRegion.fromName(effectiveRegion);

  return {
    apiUrl: apiRegion.graphqlEndpoint,
  };
};

// generate a function that encodes username and password into a basic auth header
const basicAuthHeader = (username: string, password: string) => {
  const encoded = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${encoded}`;
};

function authLink(username: string, password: string) {
  return setContext((_, { headers }) => {
    const basicAuth = basicAuthHeader(username, password);

    return {
      headers: {
        ...headers,
        authorization: `${basicAuth}`,
      },
    };
  });
}

function checkResult<T>(result: FetchResult<T>): T {
  if (result.errors) {
    throw result.errors;
  }

  if (!result.data) {
    throw new Error(`No data returned from mutation`);
  }

  return result.data;
}

/**
 * ensureError processes error and ensure content is more developer or user friendly.
 */
export const ensureError = (value: unknown): Error => {
  if (value instanceof ApolloError && isServerError(value.networkError)) {
    let message: string | undefined;
    if (value.networkError.result instanceof Object) {
      message = value.networkError.result.detail;
    }
    if (!message) {
      const result =
        typeof value.networkError.result === 'string'
          ? value.networkError.result
          : JSON.stringify(value.networkError.result);
      message = `${value.networkError.message}: ${result}`;
    }
    return new Error(message);
  }

  if (value instanceof Error) {
    return value;
  }

  let stringified = '[Unable to stringify the thrown value]';
  try {
    stringified = JSON.stringify(value);
  } catch {}

  const error = new Error(
    `This value was thrown as is, not through an Error: ${stringified}`,
  );
  return error;
};

const isServerError = (ex: unknown): ex is ServerError => {
  if (!(typeof ex === 'object') || !ex) return false;
  if (!('name' in ex)) return false;
  return ex.name === 'ServerError';
};

const domCaptureScript =
  (user: string, key: string, staticBaseUrl: string) =>
  async (): Promise<string> => {
    const url = `${staticBaseUrl}/browser-scripts/dom-capture.js`;
    const result = await fetch(url, {
      headers: {
        Authorization: basicAuthHeader(user, key),
      },
      ...fetchOptions,
    });
    if (!result.ok) {
      throw new Error(`unable to fetch browser-script for DOM capture`);
    }
    return await result.text();
  };
