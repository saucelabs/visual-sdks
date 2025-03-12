# Sauce Labs Visual Snapshot CLI

This package provides a CLI tool to create Visual snapshots of a provided PDF document.

## Requirements

```sh
node >= 18
```

## Installation and usage

```sh
npm install -g @saucelabs/visual-snapshots <command> [params]
visual-snapshots
```

```sh
npx @saucelabs/visual-snapshots <command> [params]
```

## Development

Build:

```sh
npm run build
```

Execute:

```sh
node lib/index.js pdf [params]
```

Run tests:

```sh
npm run test
```

## Reusing pdf conversion code

While it is possible to use `VisualSnapshotsApi` outside this package, please bear in mind it can only be used with ESM modules.
CommonJS modules are not supported.
