import { stringIsNullOrEmpty } from '@pnp/core'
import { getObjectValue } from './'

/**
 * Sort alphabetically
 *
 * @param a Object a
 * @param b Object b
 * @param ascending Sort ascending
 * @param property Property
 */
export function sortAlphabetically<T>(a: T, b: T, ascending?: boolean, property?: string): number {
  const aValue = getObjectValue(a, property, '*') || a
  const bValue = getObjectValue(b, property, '*') || b
  const lowerAValue = typeof aValue === 'string' ? aValue.toLowerCase() : aValue
  const lowerBValue = typeof bValue === 'string' ? bValue.toLowerCase() : bValue

  if (typeof aValue === 'string' && stringIsNullOrEmpty(lowerAValue as string)) {
    return 1
  }
  if (typeof bValue === 'string' && stringIsNullOrEmpty(lowerBValue as string)) {
    return -1
  }

  if (lowerAValue < lowerBValue) {
    return ascending ? -1 : 1
  }
  if (lowerAValue > lowerBValue) {
    return ascending ? 1 : -1
  }
  return 0
}
