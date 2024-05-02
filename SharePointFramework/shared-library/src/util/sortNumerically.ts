import { getObjectValue } from '.'

/**
 * Sort numerically
 *
 * @param a Object a
 * @param b Object b
 * @param ascending Sort ascending
 * @param property Property
 * @param currency Currency
 */
export function sortNumerically<T>(
  a: T,
  b: T,
  ascending?: boolean,
  property?: string,
  currency?: string
): number {
  const aValue = getObjectValue(a, property, '-') || a
  const bValue = getObjectValue(b, property, '-') || b

  if (typeof aValue === 'number' && isNaN(aValue)) {
    return 1
  }
  if (typeof bValue === 'number' && isNaN(bValue)) {
    return -1
  }

  if (currency && typeof aValue === 'string' && typeof bValue === 'string') {
    const aCurrencyValue = parseFloat(aValue.replace(currency, ''))
    const bCurrencyValue = parseFloat(bValue.replace(currency, ''))

    if (!isNaN(aCurrencyValue) && !isNaN(bCurrencyValue)) {
      if (aCurrencyValue < bCurrencyValue) {
        return ascending ? -1 : 1
      }
      if (aCurrencyValue > bCurrencyValue) {
        return ascending ? 1 : -1
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
