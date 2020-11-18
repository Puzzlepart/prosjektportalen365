import * as objectGet from 'object-get'

/**
 * Retrieves a value from the object using an expression, a fallback value must be specified
 *
 * @param {any} object Object
 * @param {string} expression Expression
 * @param {T} fallback Fallback
 */
export function getObjectValue<T>(object: any, expression: string, fallback: T): T {
  return objectGet(object, expression) || fallback
}
