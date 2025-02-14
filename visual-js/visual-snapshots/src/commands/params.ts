export const getParam = (
  options: { [key: string]: string },
  optionName: string,
  envVariableName: string,
  defaultValue: string | undefined = undefined,
) => {
  if (options[optionName]) {
    return options[optionName];
  }
  if (process.env[envVariableName]) {
    return process.env[envVariableName];
  }
  if (defaultValue) {
    return defaultValue;
  }
  throw new Error(
    `Missing required argument. Please provide ${optionName} option, or set ${envVariableName} environment variable.`,
  );
};
