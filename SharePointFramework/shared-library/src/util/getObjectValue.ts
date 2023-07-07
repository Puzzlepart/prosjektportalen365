import { get } from '@microsoft/sp-lodash-subset'

/**
 * Retrieves a value from the object using an expression, a fallback value should be
 * provided in case the value is not found, by default it returns `undefined` as
 * the fallback value.
 *
 * @param object Object to retrieve the value from
 * @param expression Expression to retrieve the value from the object
 * @param fallback Fallback value (default: `undefined`)
 */
export function getObjectValue<T>(object: any, expression: string, fallback: T = undefined): T {
  return get(object, expression) || fallback
}
