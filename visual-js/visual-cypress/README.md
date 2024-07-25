# Sauce Labs Visual for Cypress

This package is Sauce Labs Visual integration for Cypress.

It comes as both a plugin and commands that will be made available for your tests.

## Installation & Usage

View installation and usage instructions on the [Sauce Docs website](https://docs.saucelabs.com/visual-testing/integrations/cypress/).

## Building

Install the dependencies

```sh
npm install
```

Build [Sauce Labs Visual client library](../visual/) since Sauce Labs Visual for Cypress depends on it

```sh
npm --prefix ../visual run build
```

Finally build Sauce Labs Visual for Cypress

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
