import type { CodegenConfig } from '@graphql-codegen/cli';

const username = process.env.SAUCE_USERNAME;
const accessKey = process.env.SAUCE_ACCESS_KEY;

const codegenConfig: CodegenConfig = {
  schema: process.env.VISUAL_API_FOR_CODEGEN || `https://${username}:${accessKey}@api.us-west-1.saucelabs.com/v1/visual/graphql`,
  documents: [
    'src/**/*.ts',
    'src/**/*.graphql',
    '!src/**/__generated__/**/*',
  ],
  emitLegacyCommonJSImports: false,
  config: {
    namingConvention: {
      typeNames: 'change-case-all#pascalCase',
      transformUnderscore: true,
    },
    avoidOptionals: {
      field: true,
      inputValue: false,
      object: true,
      defaultValue: true,
    },
    scalars: {
      WebdriverSessionBlob: "string",
      WebdriverElementID: "string",
      Datetime: "Date | string | number",
      UUID: "string",
    }
  },
  generates: {
    './src/graphql/__generated__/': {
      preset: 'client',
      plugins: [],
    },
  },
};

export default codegenConfig;
