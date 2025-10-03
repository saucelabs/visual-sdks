# @saucelabs/visual-storybook

## 0.10.8

### Patch Changes

- Updated dependencies [b3c6cfe]
  - @saucelabs/visual-playwright@0.6.0

## 0.10.7

### Patch Changes

- Updated dependencies [d7d5b3a]
  - @saucelabs/visual-playwright@0.5.0

## 0.10.6

### Patch Changes

- Updated dependencies [3057be8]
  - @saucelabs/visual-playwright@0.4.0

## 0.10.5

### Patch Changes

- Updated dependencies [f365dc1]
  - @saucelabs/visual@0.16.0
  - @saucelabs/visual-playwright@0.3.6

## 0.10.4

### Patch Changes

- Updated dependencies [fcd63ed]
  - @saucelabs/visual@0.15.0
  - @saucelabs/visual-playwright@0.3.5

## 0.10.3

### Patch Changes

- Updated dependencies [5b0f1a5]
  - @saucelabs/visual@0.14.0
  - @saucelabs/visual-playwright@0.3.4

## 0.10.2

### Patch Changes

- Updated dependencies [2d4c4ca]
  - @saucelabs/visual@0.13.0
  - @saucelabs/visual-playwright@0.3.2

## 0.10.1

### Patch Changes

- Updated dependencies [d6f02a8]
  - @saucelabs/visual@0.12.0
  - @saucelabs/visual-playwright@0.3.1

## 0.9.0

### Minor Changes

- 2036ba4: add play interaction snapshot testing
  re-add storybook 6 support

## 0.8.1

### Patch Changes

- 0270311: fix postfixing of storybook name when adding variations

## 0.8.0

### Minor Changes

- 7fcad30: add ability to test variations of a story using overridable args

## 0.7.0

### Minor Changes

- f797342: Unify result checking behavior into utility
  Add automatic retry mechanism to file uploads for timeouts

### Patch Changes

- Updated dependencies [f797342]
  - @saucelabs/visual-playwright@0.2.0
  - @saucelabs/visual@0.10.0

## 0.6.4

### Patch Changes

- 08db254: fix ignore region positioning when clipSelector is also present
- Updated dependencies [08db254]
  - @saucelabs/visual-playwright@0.1.5

## 0.6.3

### Patch Changes

- Updated dependencies [8572e1b]
  - @saucelabs/visual@0.9.0
  - @saucelabs/visual-playwright@0.1.4

## 0.6.2

### Patch Changes

- 5991881: Fill out statuses in sauceVisualResults for cypress
  Bump all dependencies to use new ignore region calculation system
- Updated dependencies [5991881]
  - @saucelabs/visual@0.8.3
  - @saucelabs/visual-playwright@0.1.3

## 0.6.1

### Patch Changes

- 40cf18e: Correct passing options to global setup
- Updated dependencies [40cf18e]
  - @saucelabs/visual-playwright@0.1.2

## 0.6.0

### Minor Changes

- ff9cdb2: Rebase Storybook integration onto Playwright

### Patch Changes

- Updated dependencies [ff9cdb2]
  - @saucelabs/visual-playwright@0.1.1
  - @saucelabs/visual@0.8.2

## 0.5.1

### Patch Changes

- 1399b9c: Debugging info when upload is reaching timeout
- Updated dependencies [1399b9c]
  - @saucelabs/visual@0.8.0

## 0.5.0

### Minor Changes

- 4bafb87: Change default diffingMethod to BALANCED

### Patch Changes

- Updated dependencies [4bafb87]
  - @saucelabs/visual@0.7.0

## 0.4.2

### Patch Changes

- c94072c: Remove deprecated API calls webwebdriverSession and webdriverSessionFromArchive
- Updated dependencies [c94072c]
  - @saucelabs/visual@0.6.0

## 0.4.1

### Patch Changes

- Updated dependencies [787387a]
  - @saucelabs/visual@0.5.0

## 0.4.0

### Minor Changes

- 0384c59: Bump minor after GH migration

### Patch Changes

- ed72709: migrate source to github
- Updated dependencies [ed72709]
- Updated dependencies [0384c59]
  - @saucelabs/visual@0.4.0

## 0.3.326

The default clipping behaviour changed to true. This will make sure images are clipped to the boundary of components instead of capturing the whole viewport. This change will affect all non clipped baselines created with previous sdk versions. Either recreating the baselines is needed (recommended) or changing the config to false.
