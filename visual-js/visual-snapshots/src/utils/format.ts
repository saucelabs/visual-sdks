/**
 * Replaces all occurrences of keys in format of `{key}` in `value` with `data[key]`.
 *
 * If `key` does not exist in data, it is left as it is.
 */
export function formatString(
  value: string,
  data: Record<string, string | number>
) {
  return Object.entries(data)
    .map(([k, v]) => [k, v.toString()] as const)
    .reduce((current, [k, v]) => current.replaceAll(`{${k}}`, v), value);
}
