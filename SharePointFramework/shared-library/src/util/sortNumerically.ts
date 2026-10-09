import { getObjectValue } from '.'

/**
 * The number a value holds: a number, or text that is a number (search returns numbers as text);
 * `undefined` for anything else, such as a date or an empty value.
 */
function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return isNaN(value) ? undefined : value
  if (typeof value !== 'string' || value.trim() === '') return undefined
  const number = Number(value.trim())
  return Number.isFinite(number) ? number : undefined
}

/**
 * Sort numerically: numbers, and numbers in text, by their value; amounts and percentages once
 * `symbol` is removed; any other value as it is.
 *
 * @param a Object a
 * @param b Object b
 * @param ascending Sort ascending
 * @param property Property
 * @param symbol Symbol to remove from string
 */
export function sortNumerically<T>(
  a: T,
  b: T,
  ascending?: boolean,
  property?: string,
  symbol?: string
): number {
  const aValue = getObjectValue(a, property, '-') || a
  const bValue = getObjectValue(b, property, '-') || b

  if (typeof aValue === 'number' && isNaN(aValue)) {
    return 1
  }
  if (typeof bValue === 'number' && isNaN(bValue)) {
    return -1
  }

  if (symbol) {
    const aString = typeof aValue === 'string' ? aValue : String(aValue ?? '')
    const bString = typeof bValue === 'string' ? bValue : String(bValue ?? '')

    if (aString && bString) {
      const aFloatValue = parseFloat(aString.replace(symbol, ''))
      const bFloatValue = parseFloat(bString.replace(symbol, ''))

      if (!isNaN(aFloatValue) && !isNaN(bFloatValue)) {
        if (aFloatValue < bFloatValue) {
          return ascending ? -1 : 1
        }
        if (aFloatValue > bFloatValue) {
          return ascending ? 1 : -1
        }
      }
    }
  }

  // Compared as text, "30" would come before "4".
  const aNumber = asNumber(aValue)
  const bNumber = asNumber(bValue)
  if (aNumber !== undefined && bNumber !== undefined) {
    if (aNumber < bNumber) return ascending ? -1 : 1
    if (aNumber > bNumber) return ascending ? 1 : -1
    return 0
  }

  if (aValue < bValue) {
    return ascending ? -1 : 1
  }
  if (aValue > bValue) {
    return ascending ? 1 : -1
  }
  return 0
}
