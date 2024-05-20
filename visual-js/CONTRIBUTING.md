## Using changesets

- Please use `npx changeset` command to instruct [changesets](https://github.com/changesets/changesets/tree/main) to generate the change summary and versioning information.
  After you're done with the command you'll be able to see a .md file created in .changeset folder listing the packages and the type of release picked (major, minor or patch)

- Once the PR is merged, `JS (release)` GitHub action needs to be run manually. This action will run `npx changeset version` to update and commit the package.json files using the release information from the .md file. `npx changeset publish` is executed right after to publish the latest version to public npm registry.
