import { InvalidArgumentError } from "commander";

const UUID_REGEX =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const DASHLESS_UUID_REGEX = /^[a-f0-9]{32}$/i;

export function parseUuid(input: string) {
  if (UUID_REGEX.test(input)) {
    return input;
  }

  if (DASHLESS_UUID_REGEX.test(input)) {
    return (
      `${input.substring(0, 8)}-` +
      `${input.substring(8, 12)}-` +
      `${input.substring(12, 16)}-` +
      `${input.substring(16, 20)}-` +
      `${input.substring(20, 32)}`
    );
  }

  throw new InvalidArgumentError(
    "Expected UUID in form of xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx or 32 hexadecimal characters."
  );
}
