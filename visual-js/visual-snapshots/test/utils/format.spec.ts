import { formatString } from "../../src/utils/format.js";

describe("formatString", () => {
  it("should replace all occurences of key with data from object", () => {
    const value = "foo {foo} bar {foo} {bar}";
    const data = { foo: "xyz", bar: 123 };
    const expected = "foo xyz bar xyz 123";

    expect(formatString(value, data)).toEqual(expected);
  });

  it("should not replace keys that do not exist in data", () => {
    const value = "foo {foo}";
    const data = { bar: 123 };
    const expected = "foo {foo}";

    expect(formatString(value, data)).toEqual(expected);
  });
});
