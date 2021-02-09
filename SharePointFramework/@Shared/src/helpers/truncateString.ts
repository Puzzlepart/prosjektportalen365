/**
 * Truncate string to the desired length
 *
 * @param {string} str String
 * @param {number} n Length
 */
export function truncateString(str: string, n: number) {
  return (str.length > n) ? str.substr(0, n - 1) + '&hellip;' : str
}
