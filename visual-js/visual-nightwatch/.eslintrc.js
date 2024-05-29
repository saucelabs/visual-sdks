module.exports = {
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  root: true,
  parserOptions: {
    "ecmaVersion": "latest"
  },
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'jest.config.js'],
  rules: {},
};
