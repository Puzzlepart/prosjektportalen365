import { getUILocale } from './getUILocale'
import { tryParseFloat } from './tryParseFloat'

/**
 * Try parse as currency format, the amount grouped in SharePoint's UI language ("kr 1 234 567" in
 * Norwegian, "kr 1,234,567" in English), not the browser's.
 *
 * @param str String to parse
 * @param fallback  Fallback value
 * @param currencyPrefix Currency prefix
 * @param minimumFractionDigits Minimum fraction digits
 * @param maximumFractionDigits Maximum fraction digits
 */
export function tryParseCurrency(
  str: string,
  fallback: string = '',
  currencyPrefix = 'kr',
  minimumFractionDigits = 0,
  maximumFractionDigits = 0
): string {
  const parsed = tryParseFloat(str, fallback)
  if (parsed === fallback) return fallback
  return (
    `${currencyPrefix} ` +
    (parsed as number).toLocaleString(getUILocale(), {
      minimumFractionDigits,
      maximumFractionDigits
    })
  )
}
