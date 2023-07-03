/**
 * Parse JSON string to object or return fallback value. This try-catches the JSON.parse
 * method and returns the fallback value if the parsing fails.
 *
 * @param string String to parse
 * @param fallbackValue Fallback value if parsing fails
 */
export function tryParseJson<ValueType>(
  string: string,
  fallbackValue: ValueType = null
): ValueType {
  try {
    return !!string ? JSON.parse(string) : fallbackValue
  } catch {
    return fallbackValue
  }
}
