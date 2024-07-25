# Sauce Labs Visual for Nightwatch

This package is Sauce Labs Visual integration for Nightwatch.

It comes as a service that you can add to your existing Nightwatch project.

## Installation & Usage

View installation and usage instructions on the [Sauce Docs website](https://docs.saucelabs.com/visual-testing/integrations/nightwatch/).

## Building

Install the dependencies

```sh
npm install
```

Build [Sauce Labs Visual client library](../visual/) since Sauce Labs Visual for Nightwatch depends on it

```sh
npm --prefix ../visual run build
```

Finally build Sauce Labs Visual for Nightwatch

```sh
npm run build
```

## Linting

```sh
npm run lint
```
