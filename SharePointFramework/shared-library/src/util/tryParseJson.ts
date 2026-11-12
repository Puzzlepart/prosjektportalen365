/**
 * Try to parse a string as JSON, if it fails, return fallback
 * which defaults to `null`.
 *
 * @param fallback Fallback if parse fails (default: `null`)
 */
export function tryParseJson<T = any>(str: string, fallback: T = null): T {
  try {
    const parsed: T = str ? JSON.parse(str) : fallback
    return parsed
  } catch {
    return fallback
  }
}
