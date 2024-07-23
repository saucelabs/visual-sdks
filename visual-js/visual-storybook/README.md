# Sauce Labs Visual Storybook Integration

An extension for [Storybook's test-runner](https://github.com/storybookjs/test-runner) to integrate effortless visual testing with Sauce Labs Visual.

## Installation & Usage

View installation and usage instructions on the [Sauce Docs website](https://docs.saucelabs.com/visual-testing/integrations/storybook/).

## Building

Install the dependencies

```sh
npm install
```

Build [Sauce Labs Visual client library](../visual/) since Sauce Labs Visual Storybook Integration depends on it

```sh
npm --prefix ../visual run build
```

Finally build Sauce Labs Visual Storybook Integration

```sh
npm run build
```

## Linting

```sh
npm run lint
```

## Running the tests

```sh
npm run test
```
