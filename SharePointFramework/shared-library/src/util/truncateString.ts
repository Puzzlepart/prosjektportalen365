/**
 * Truncate string to the desired length
 *
 * @param str String
 * @param n Length
 */
export function truncateString(str: string, n: number) {
  return str.length > n ? str.substr(0, n - 1) + '&hellip;' : str
}
