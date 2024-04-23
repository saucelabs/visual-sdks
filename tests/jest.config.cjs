/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/*.spec.ts'],
  testPathIgnorePatterns: ['/project/', '/node_modules/'],
  runner: './utils/runner.ts',
  setupFilesAfterEnv: ['jest-extended/all'],
  bail: 1,
};
