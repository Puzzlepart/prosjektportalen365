// Matches a `{0}` style token. Deliberately only digits, as in Fluent UI v8.
const FORMAT_REGEX = /\{\d+\}/g

// Strips the braces off a matched token so it can be used as a lookup key.
const FORMAT_BRACES_REGEX = /[{}]/g

/**
 * Replaces `{0}`, `{1}`, ... in a tokenized string with the corresponding
 * value. Used for localized strings, where the text comes from the loc bundle
 * and the values are filled in at runtime.
 *
 * This replaces `format` from Fluent UI v8 (`@fluentui/react`,
 * `@fluentui/react/lib/Utilities` and `@uifabric/utilities`), which has no
 * Fluent UI v9 equivalent. The semantics are identical, quirks included, so
 * that swapping the import cannot change what a user sees; `format.test.ts`
 * compares the two implementations case by case.
 *
 * @param s - Tokenized string, normally a key from the loc bundle
 * @param values - Values to substitute, in token order
 */
export function format(s: string, ...values: any[]): string {
  return s.replace(FORMAT_REGEX, (match) => {
    // Indexed with the token's own digits rather than with a parsed number,
    // because that is what v8 did: `{00}` looks up the key '00', which an array
    // does not have, so it renders empty instead of falling back to index 0.
    const replacement = (values as unknown as Record<string, unknown>)[
      match.replace(FORMAT_BRACES_REGEX, '')
    ]
    // Only null and undefined are blanked; 0, false and '' are rendered.
    return replacement === null || replacement === undefined ? '' : String(replacement)
  })
}
