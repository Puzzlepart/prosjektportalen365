/**
 * Replaces matching single-brace tokens with top-level object values, blanking falsy values.
 *
 * @param regex Matches complete tokens, including the outer character stripped from each end.
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
