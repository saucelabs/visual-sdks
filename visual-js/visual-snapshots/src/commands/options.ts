import { Option } from "commander";
import { EOL } from "os";

export const usernameOption = new Option(
  "-u, --username <username>",
  "Your Sauce Labs username. You can get this from the header of app.saucelabs.com." +
    EOL +
    "If not provided, SAUCE_USERNAME environment variable will be used.",
)
  .env("SAUCE_USERNAME")
  .makeOptionMandatory(true);

export const accessKeyOption = new Option(
  "-k, --access-key <access-key>",
  "Your Sauce Labs access key. You can get this from the header of app.saucelabs.com" +
    EOL +
    "If not provided, SAUCE_ACCESS_KEY environment variable will be used.",
)
  .env("SAUCE_ACCESS_KEY")
  .makeOptionMandatory(true);

export const regionOption = new Option(
  "-r, --region <region>",
  "The region you\'d like to run your Visual tests in. Defaults to \'us-west-1\' if not supplied. Can be one of the following: \'eu-central-1\', \'us-west-1\' or \'us-east-4\'." +
    EOL +
    "If not provided, SAUCE_REGION environment variable will be used.",
)
  .env("SAUCE_REGION")
  .defaultValue("us-west-1");

export const buildNameOption = new Option(
  "-n, --build-name <build-name>",
  "The name you would like to appear in the Sauce Visual dashboard." +
    EOL +
    "If not provided, SAUCE_VISUAL_BUILD_NAME environment variable will be used.",
).env("SAUCE_VISUAL_BUILD_NAME");

export const branchOption = new Option(
  "-b, --branch <branch>",
  "The branch name you would like to associate this build with. We recommend using your current VCS branch in CI." +
    EOL +
    "If not provided, SAUCE_VISUAL_BRANCH environment variable will be used.",
).env("SAUCE_VISUAL_BRANCH");

export const defaultBranchOption = new Option(
  "-d, --default-branch <default-branch>",
  "	The main branch name you would like to associate this build with. Usually \'main\' or \'master\' or alternatively the branch name your current branch was derived from." +
    EOL +
    "If not provided, SAUCE_VISUAL_DEFAULT_BRANCH environment variable will be used.",
).env("SAUCE_VISUAL_DEFAULT_BRANCH");

export const projectOption = new Option(
  "-p, --project <project>",
  "The label / project you would like to associate this build with." +
    EOL +
    "If not provided, SAUCE_VISUAL_PROJECT environment variable will be used.",
).env("SAUCE_VISUAL_PROJECT");

export const buildIdOption = new Option(
  "--build-id <build-id>",
  "For advanced users, a user-supplied SauceLabs Visual build ID. Can be used to create builds in advance using the GraphQL API. This can be used to parallelize tests with multiple browsers, shard, or more." +
    EOL +
    "By default, this is not set and we create / finish a build during setup / teardown." +
    EOL +
    "If not provided, SAUCE_VISUAL_BUILD_ID environment variable will be used.",
).env("SAUCE_VISUAL_BUILD_ID");

export const customIdOption = new Option(
  "--custom-id <custom-id>",
  "For advanced users, a user-supplied custom ID to identify this build. Can be used in CI to identify / check / re-check the status of a single build. Usage suggestions: CI pipeline ID." +
    EOL +
    "If not provided, SAUCE_VISUAL_CUSTOM_ID environment variable will be used.",
).env("SAUCE_VISUAL_CUSTOM_ID");
