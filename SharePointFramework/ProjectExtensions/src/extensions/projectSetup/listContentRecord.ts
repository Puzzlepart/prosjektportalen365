/**
 * What a project records about the list content (`Listeinnhold`) the setup has added to it:
 * `GtProjectListContent` in its properties, the titles separated by `, `, as
 * `SetupProjectInformation` writes it.
 */

const SEPARATOR = ', '

/**
 * The most the record holds: `GtProjectListContent` is a single line of text (`MaxLength` 255).
 */
const MAX_LENGTH = 255

/**
 * Checks a complete list-content title against the comma-separated GtProjectListContent record.
 *
 */
export function isListContentAdded(record: string, contentConfig: { text: string }): boolean {
  if (!record || !contentConfig.text) return false
  return `${SEPARATOR}${record}${SEPARATOR}`.includes(
    `${SEPARATOR}${contentConfig.text}${SEPARATOR}`
  )
}

/**
 * Identifies hub content that must be explicitly re-selected to avoid duplicate rows.
 * Cloud content is excluded because its rows are matched by KeyColumn instead.
 */
export function isAddedBefore(
  record: string,
  template: { isCloudTemplate?: boolean },
  contentConfig: { text: string }
): boolean {
  return !template?.isCloudTemplate && isListContentAdded(record, contentConfig)
}

/**
 * Appends newly added titles without losing earlier runs' content or exceeding the field limit.
 */
export function recordListContent(record: string, selected: Array<{ text: string }>): string {
  return selected.reduce((recorded, contentConfig) => {
    if (!contentConfig.text || isListContentAdded(recorded, contentConfig)) return recorded
    const next = recorded ? `${recorded}${SEPARATOR}${contentConfig.text}` : contentConfig.text
    return next.length <= MAX_LENGTH ? next : recorded
  }, record ?? '')
}
