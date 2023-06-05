import { tryParseFloat } from './'

/**
 *
 * @param str The string to parse
 * @param addPostfix Add postfix (%)
 * @param fallback Fallback if parse fails
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
