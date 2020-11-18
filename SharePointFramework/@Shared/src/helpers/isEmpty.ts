/**
 * Checks if string is empty
 *
 * @param {string} str String
 */
export function isEmpty(str: string) {
  return !str || /^\s*$/.test(str)
}
