import type { CodegenConfig } from '@graphql-codegen/cli';

const codegenConfig: CodegenConfig = {
  schema: 'schema/__generated__/schema.graphql',
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
      WebdriverSessionBlob: "string"
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
