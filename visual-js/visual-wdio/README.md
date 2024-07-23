# Sauce Labs Visual for WebdriverIO

This package is Sauce Labs Visual integration for WebdriverIO.

It comes as a service that you can add to your existing WebdriverIO project.

## Installation & Usage

View installation and usage instructions on the [Sauce Docs website](https://docs.saucelabs.com/visual-testing/integrations/webdriverio/).

## Building

Install the dependencies

```sh
npm install
```

Build [Sauce Labs Visual client library](../visual/) since Sauce Labs Visual for WebdriverIO depends on it

```sh
npm --prefix ../visual run build
```

Finally build Sauce Labs Visual for WebdriverIO

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
