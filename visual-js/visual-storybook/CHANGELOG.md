# @saucelabs/visual-storybook

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
