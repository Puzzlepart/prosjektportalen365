/**
 * Checks if string is empty
 *
 * @param str String
 */
export function isEmpty(str: string) {
  return !str || /^\s*$/.test(str)
}
