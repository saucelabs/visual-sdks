/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // [...]
  preset: "ts-jest/presets/default-esm", // or other ESM presets
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testPathIgnorePatterns: ["/lib/"],
  setupFiles: ["./jest.setup.mjs"],
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
};
