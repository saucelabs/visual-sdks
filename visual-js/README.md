# Sauce Labs Visual for JS/TS

This folder hosts the Sauce Labs Visual SDKs for JS/TS testing. For detailed instructions of an SDK, please see the relative folder.

## Building

```sh
npm run build --workspaces --if-present
```

## Linting

```sh
npm run lint --workspaces --if-present
```

## Running the tests locally

```sh
npm run test --workspaces --if-present
```

## Using changesets

- Please use `npx changeset` command to instruct [changesets](https://github.com/changesets/changesets/tree/main) to generate the change summary and versioning information.
  After you're done with the command you'll be able to see a .md file created in .changeset folder listing the packages and the type of release picked (major, minor or patch)
