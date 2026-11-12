/**
 * Parses a floating-point value, returning the supplied fallback for NaN.
 */
export function tryParseFloat(str: string, fallback: string | number): number | string {
  const parsed = parseFloat(str)
  return !isNaN(parsed) ? parsed : fallback
}
