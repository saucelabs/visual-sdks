module.exports = {
  extends: ['plugin:prettier/recommended'],
  root: true,
  parserOptions: {
    ecmaVersion: 'latesct',
    sourceType: 'module',
  },
  parser: '@typescript-eslint/parser',
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'jest.config.js'],
  rules: {},
};
