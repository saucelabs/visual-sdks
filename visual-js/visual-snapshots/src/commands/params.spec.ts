import { getParam } from "./params";

const EXISTING_OPTION_NAME = "existing-option-name";
const EXISTING_OPTION_VALUE = "option-value";
const NON_EXISTING_OPTION_NAME = "non-existing-option-name";

const EXISTING_ENV_VARIABLE_NAME = "EXISTING_ENV_VARIABLE";
const EXISTING_ENV_VARIABLE_VALUE = "existing-env-variable-value";
const NON_EXISTING_ENV_VARIABLE_NAME = "NON_EXISTING_ENV_VARIABLE";

const DEFAULT_VALUE = "default-value";

const OPTIONS = {
  [EXISTING_OPTION_NAME]: EXISTING_OPTION_VALUE,
};

describe("getParam", () => {
  beforeAll(async () => {
    process.env.EXISTING_ENV_VARIABLE = 'existing-env-variable-value';
  });

  test("retuns option value when option exists", () => {
    expect(
      getParam(
        OPTIONS,
        EXISTING_OPTION_NAME,
        EXISTING_ENV_VARIABLE_NAME,
        DEFAULT_VALUE,
      ),
    ).toEqual(EXISTING_OPTION_VALUE);
  });

  test("retuns environment variable value when option does not exist and environment variable exists", () => {
    expect(
      getParam(
        OPTIONS,
        NON_EXISTING_OPTION_NAME,
        EXISTING_ENV_VARIABLE_NAME,
        DEFAULT_VALUE,
      ),
    ).toEqual(EXISTING_ENV_VARIABLE_VALUE);
  });

  test("retuns default value if default value provided and neither option nor environment variable are provided", () => {
    expect(
      getParam(
        OPTIONS,
        NON_EXISTING_OPTION_NAME,
        NON_EXISTING_ENV_VARIABLE_NAME,
        DEFAULT_VALUE,
      ),
    ).toEqual(DEFAULT_VALUE);
  });

  test("throws exception when neither option, environment variable, nor default value are provided", () => {
    expect(() => {
      getParam(
        OPTIONS,
        NON_EXISTING_OPTION_NAME,
        NON_EXISTING_ENV_VARIABLE_NAME,
      );
    }).toThrow();
  });
});
