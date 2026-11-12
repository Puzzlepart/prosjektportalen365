/**
 * Parses a base-10 integer, returning the supplied fallback for NaN.
 */
export function tryParseInt(str: string, fallback: string): number | string {
  const parsed = parseInt(str, 10)
  return !isNaN(parsed) ? parsed : fallback
}
