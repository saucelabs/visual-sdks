# @saucelabs/storybook-variants

## 0.3.0

### Minor Changes

- f3074b2: Add support for Storybook 10.

  **Breaking:** this release requires Storybook 10. Storybook 7 is no longer supported — stay on `0.2.x` if you can't upgrade to Storybook 10 yet.

  - `storybook@^10.0.0` and `react@^18.0.0 || ^19.0.0` are now declared as peer dependencies (React was already used but not declared).
  - The toolbar toggle now uses `@storybook/icons`, replacing the `Icons` component removed in Storybook 8.
  - Migrated to Storybook 10's consolidated `storybook/*` import paths and the `initialGlobals` preview annotation.
  - Fixed the preview failing to load under `storybook dev` with Vite ("does not provide an export named 'default'"). The CommonJS-only `cartesian` and `lodash` are now bundled into the addon, so it has no runtime dependencies.
