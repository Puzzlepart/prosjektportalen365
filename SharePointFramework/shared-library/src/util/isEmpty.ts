/**
 * Checks whether text is absent, empty or entirely whitespace.
 */
export function isEmpty(str: string) {
  return !str || /^\s*$/.test(str)
}
