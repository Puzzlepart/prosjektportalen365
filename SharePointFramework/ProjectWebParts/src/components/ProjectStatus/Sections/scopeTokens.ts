import { SectionModel } from 'pp365-shared-library/lib/models'

/**
 * Token replaced with the selected report scope key (e.g. `DP1`) in section
 * configuration values (`GtSecList`, `GtSecViewQuery`, `GtSecView`).
 */
export const SCOPE_TOKEN = '{scope}'

/**
 * Token replaced with the selected report scope label (e.g. `Samordning og
 * styring`) in section configuration values.
 */
export const SCOPE_LABEL_TOKEN = '{scopeLabel}'

/**
 * Returns `true` if the value contains one of the scope tokens
 * (`{scope}` / `{scopeLabel}`).
 *
 * @param value Section configuration value
 */
export function containsScopeTokens(value: string): boolean {
  return (
    (value ?? '').indexOf(SCOPE_TOKEN) !== -1 || (value ?? '').indexOf(SCOPE_LABEL_TOKEN) !== -1
  )
}

/**
 * Replaces the scope tokens (`{scope}` / `{scopeLabel}`) in a section
 * configuration value with the selected report scope key and label.
 *
 * @param value Section configuration value
 * @param scopeKey Selected report scope key
 * @param scopeLabel Selected report scope label
 */
export function replaceScopeTokens(value: string, scopeKey: string, scopeLabel: string): string {
  return (value ?? '')
    .split(SCOPE_LABEL_TOKEN)
    .join(scopeLabel ?? '')
    .split(SCOPE_TOKEN)
    .join(scopeKey ?? '')
}

/**
 * Escapes a value for safe interpolation into XML (CAML view queries) —
 * `&`, `<`, `>`, `"` and `'` are replaced with their entity references, so a
 * scope key or label can never restructure the query it is substituted into.
 *
 * @param value Value to escape
 */
export function escapeXmlValue(value: string): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Returns `true` if any of the section's configuration values (`listTitle`,
 * `viewQuery`, `viewName`) contain scope tokens. Such sections are scoped to
 * a report series ("delprosjekt") and are hidden for the default series.
 *
 * @param section Section
 */
export function sectionContainsScopeTokens(section: SectionModel): boolean {
  return (
    containsScopeTokens(section.listTitle) ||
    containsScopeTokens(section.viewQuery) ||
    containsScopeTokens(section.viewName)
  )
}
