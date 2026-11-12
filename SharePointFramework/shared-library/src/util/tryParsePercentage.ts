import { tryParseFloat } from './'

/**
 * Converts a parsed share of one to a percentage, optionally adding %, or returns the supplied fallback.
 */
export function tryParsePercentage(
  str: string,
  addPostfix: boolean = true,
  fallback: string | number
): number | string {
  const parsed = tryParseFloat(str, fallback)
  if (parsed === fallback) {
    return fallback
  }
  const percentage = (parsed as number) * 100
  return addPostfix ? `${percentage}%` : percentage
}
