import { get } from '@microsoft/sp-lodash-subset'

/**
 * Retrieves a value from the object using an expression, a fallback value must be specified
 *
 * @param object Object
 * @param expression Expression
 * @param fallback Fallback
 */
export function getObjectValue<T>(object: any, expression: string, fallback: T): T {
  return get(object, expression) || fallback
}
