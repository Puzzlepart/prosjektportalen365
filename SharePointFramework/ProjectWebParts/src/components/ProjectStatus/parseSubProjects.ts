/**
 * A sub-project ("delprosjekt") entry from the web part's `subProjects`
 * property.
 */
export interface ISubProject {
  /**
   * Scope key — becomes part of the stored `GtSiteId` value and is the
   * identity of the report series.
   */
  key: string

  /**
   * Display label. Falls back to the key when no label is configured.
   */
  label: string
}

const FORBIDDEN_CHARACTERS = /['|?&#%]/
const MAX_KEY_LENGTH = 32

/**
 * Parses the web part's `subProjects` property (one sub-project per line on
 * the format `key` or `key|label`) into a validated list. Invalid lines are
 * dropped: empty keys, keys longer than 32 characters, keys containing
 * `'`, `|`, `?`, `&`, `#` or `%`, and keys starting with `-` or whitespace.
 * Duplicate keys (case-insensitive) are deduplicated, keeping the first.
 *
 * @param subProjects Raw `subProjects` property value
 */
export function parseSubProjects(subProjects: string): ISubProject[] {
  const parsedSubProjects: ISubProject[] = []
  const seenKeys = new Set<string>()
  for (const line of (subProjects ?? '').split(/\r?\n/)) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    const separatorIndex = trimmedLine.indexOf('|')
    const key = (separatorIndex === -1 ? trimmedLine : trimmedLine.slice(0, separatorIndex)).trim()
    const label =
      (separatorIndex === -1 ? '' : trimmedLine.slice(separatorIndex + 1)).trim() || key
    if (
      !key ||
      key.length > MAX_KEY_LENGTH ||
      FORBIDDEN_CHARACTERS.test(key) ||
      key.startsWith('-')
    ) {
      continue
    }
    const normalizedKey = key.toLowerCase()
    if (seenKeys.has(normalizedKey)) continue
    seenKeys.add(normalizedKey)
    parsedSubProjects.push({ key, label })
  }
  return parsedSubProjects
}

/**
 * Returns the display label for a scope key, falling back to the key itself
 * when the key is not found in the configured sub-projects (e.g. a series
 * whose key was removed or renamed in the configuration).
 *
 * @param subProjects Parsed sub-projects (from `parseSubProjects`)
 * @param scopeKey Scope key
 */
export function getScopeLabel(subProjects: ISubProject[], scopeKey: string): string {
  const trimmedScopeKey = (scopeKey ?? '').trim()
  if (!trimmedScopeKey) return ''
  const subProject = subProjects.find(
    ({ key }) => key.toLowerCase() === trimmedScopeKey.toLowerCase()
  )
  return subProject?.label ?? trimmedScopeKey
}
