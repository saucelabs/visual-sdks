# Sauce Labs Visual Snapshot CLI

This package provides a CLI tool to create Visual snapshots of a provided PDF document.

## Requirements

```sh
node >= 18
```

## Installation

```sh
yarn install --save @saucelabs/visual-snapshots
```

## Development

Build:

```sh
yarn run build
```

Execute:

```sh
node lib/index.js pdf [params]
```

Run tests:

```sh
yarn run test
```

## Reusing pdf conversion code

While it is possible to use `VisualSnapshotsApi` outside this package, please bear in mind it can only be used with ESM modules.
CommonJS modules are not supported.
