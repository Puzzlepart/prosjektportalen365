/**
 * `true` when the raw value of a Yes/No column represents a checked value.
 *
 * The same column can reach us in different shapes depending on where the item
 * came from: list items fetched over REST hold real booleans (`true`/`false`),
 * while SharePoint Search returns the strings `1`/`0`. Parsing the value as a
 * number only covers the latter - `parseInt(true)` is `NaN` - so both shapes,
 * and missing values, are handled here instead.
 *
 * @param value Raw value
 */
export function isTrueBooleanValue(value: any): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase()
    if (normalizedValue === 'true' || normalizedValue === 'yes') return true
    // Keeps the previous behaviour for every other string value.
    return parseInt(normalizedValue) === 1
  }
  return false
}
