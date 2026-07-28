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
