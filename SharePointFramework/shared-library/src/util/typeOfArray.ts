import _ from 'lodash'

/**
 * Checks the type of an array by checking the type of the first element.
 *
 * @param arr Array to check the type of
 */
export function typeOfArray(arr: any[]): string {
  return typeof _.first(arr)
}
