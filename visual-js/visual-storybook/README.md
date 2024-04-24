# Sauce Labs Visual Storybook Integration

An extension for [Storybook's test-runner](https://github.com/storybookjs/test-runner) to integrate effortless visual testing with Sauce Labs Visual.

## Installation & Usage

View installation and usage instructions on the [Sauce Docs website](https://docs.saucelabs.com/visual-testing/integrations/storybook/).

## Changelog

### 0.3.326

The default clipping behaviour changed to true. This will make sure images are clipped to the boundary of components instead of capturing the whole viewport. This change will affect all non clipped baselines created with previous sdk versions. Either recreating the baselines is needed (recommended) or changing the config to false.
