# Sauce Labs Visual Playwright Integration

An extension for [Playwright](https://playwright.dev/) to integrate effortless visual testing with Sauce Labs Visual.

## Installation & Usage

View installation and usage instructions on the [Sauce Docs website](https://docs.saucelabs.com/visual-testing/integrations/playwright/).

## Building

Install the dependencies

```sh
npm install
```

Build [Sauce Labs Visual client library](../visual/) since Sauce Labs Visual Playwright Integration depends on it

```sh
npm --prefix ../visual run build
```

Finally build Sauce Labs Visual Playwright Integration

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
