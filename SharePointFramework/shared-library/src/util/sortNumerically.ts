import { getObjectValue } from '.'

/**
 * Sort numerically
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

  if (aValue < bValue) {
    return ascending ? -1 : 1
  }
  if (aValue > bValue) {
    return ascending ? 1 : -1
  }
  return 0
}
