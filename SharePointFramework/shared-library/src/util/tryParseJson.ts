/**
 * Parse JSON string to object or return fallback value. This try-catches the JSON.parse
 * method and returns the fallback value if the parsing fails.
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
