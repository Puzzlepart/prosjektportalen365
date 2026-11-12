import { get } from '@microsoft/sp-lodash-subset'

/**
 * Reads a nested object path, using the fallback for every falsy value, including zero and false.
 */
export function getObjectValue<T>(object: any, expression: string, fallback: T = undefined): T {
  return get(object, expression) || fallback
}
