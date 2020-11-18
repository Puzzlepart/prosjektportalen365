import { TypedHash } from '@pnp/common'

/**
 * Replace tokens
 *
 * @param {string} str The string
 * @param {TypedHash} obj Object containing misc values (no deep support)
 * @param {RegExp} regex Regex
 */
export function replaceTokens(
  str: string,
  obj: TypedHash<any>,
  regex: RegExp = /\{[A-Za-z]*\}/gm
): string {
  return str.match(regex).reduce((s, value) => {
    const field = value.substring(1, value.length - 1)
    return s.replace(value, obj[field] || '')
  }, str)
}
