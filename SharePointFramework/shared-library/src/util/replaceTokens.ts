/**
 * Replace tokens
 *
 * @param str The string
 * @param obj Object containing misc values (no deep support)
 * @param regex Regex
 */
export function replaceTokens(
  str: string,
  obj: Record<string, any>,
  regex: RegExp = /\{[A-Za-z]*\}/gm
): string {
  try {
    return str.match(regex).reduce((s, value) => {
      const field = value.substring(1, value.length - 1)
      return s.replace(value, obj[field] || '')
    }, str)
  } catch {
    return str
  }
}
