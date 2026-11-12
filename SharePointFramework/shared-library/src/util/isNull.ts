/**
 * Checks for null or undefined without treating other falsy values as absent.
 */
export function isNull(obj: any) {
  return obj === null || obj === undefined
}
