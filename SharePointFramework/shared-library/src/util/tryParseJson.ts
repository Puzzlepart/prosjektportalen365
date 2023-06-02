/**
 * Try parse JSON
 *
 * @param string String to parse
 * @param fallback Fallback value
 */
export function tryParseJson<ValueType>(string: string, fallback: ValueType = null): ValueType {
  try {
    return JSON.parse(string) || fallback
  } catch {
    return fallback
  }
}
