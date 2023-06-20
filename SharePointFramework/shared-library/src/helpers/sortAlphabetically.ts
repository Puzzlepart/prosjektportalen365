import { getObjectValue } from './'

/**
 * Sort alphabetically
 *
 * @param a Object a
 * @param b Object b
 * @param ascending Sort ascending
 * @param property Property
 */
export function sortAlphabetically<T>(
  a: T,
  b: T,
  ascending?: boolean,
  property?: string
): number {
  const aValue = getObjectValue(a, property, '') || a
  const bValue = getObjectValue(b, property, '') || b
  if (aValue < bValue) {
    return ascending ? -1 : 1
  }
  if (aValue > bValue) {
    return ascending ? 1 : -1
  }
  return 0
}
