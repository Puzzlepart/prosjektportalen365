/**
 * Try to parse a string as JSON, if it fails, return fallback
 *
 * @param str The string to parse as JSON
 * @param fallback Fallback if parse fails
 */
export function tryParseJson<T = any>(str: string, fallback: T): T {
  try {
    const parsed = str ? JSON.parse(str) : fallback
    return parsed
  } catch {
    return fallback
  }
}
