/**
 * Shortens long text to n minus one characters followed by the HTML entity &hellip;.
 */
export function truncateString(str: string, n: number) {
  return str.length > n ? str.substr(0, n - 1) + '&hellip;' : str
}
