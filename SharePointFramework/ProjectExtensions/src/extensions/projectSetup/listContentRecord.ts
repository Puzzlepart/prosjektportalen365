/**
 * What a project records about the list content (`Listeinnhold`) the setup has added to it:
 * `GtProjectListContent` in its properties, the titles separated by `, `, as
 * `SetupProjectInformation` writes it.
 */

/**
 * The separator between the titles in the record.
 */
const SEPARATOR = ', '

/**
 * The most the record holds: `GtProjectListContent` is a single line of text (`MaxLength` 255).
 */
const MAX_LENGTH = 255

/**
 * Whether the record names `contentConfig`: its title is one of the record's titles, not only a
 * part of one.
 *
 * @param record The record (`GtProjectListContent`)
 * @param contentConfig The list content
 */
export function isListContentAdded(record: string, contentConfig: { text: string }): boolean {
  if (!record || !contentConfig.text) return false
  return `${SEPARATOR}${record}${SEPARATOR}`.includes(
    `${SEPARATOR}${contentConfig.text}${SEPARATOR}`
  )
}

/**
 * Whether a run of the setup on a project set up before leaves the list content out unless it is
 * chosen: content from the hub's `Listeinnhold` that the project's record names. Its rows are
 * added, not matched with the items the list has (the titles of the phase checkpoints repeat
 * across the phases), so it would be added a second time. A cloud template's content is not left
 * out: its rows are matched by their KeyColumn.
 *
 * @param record The record (`GtProjectListContent`)
 * @param template The template chosen
 * @param contentConfig The list content
 */
export function isAddedBefore(
  record: string,
  template: { isCloudTemplate?: boolean },
  contentConfig: { text: string }
): boolean {
  return !template?.isCloudTemplate && isListContentAdded(record, contentConfig)
}

/**
 * The record after a run of the setup: the titles it had, then the titles of `selected` it lacks,
 * as many as the column holds. Before, each run wrote only its own selection, so a run with none
 * forgot what the runs before had added.
 *
 * @param record The record before the run
 * @param selected The list content the run adds
 */
export function recordListContent(record: string, selected: Array<{ text: string }>): string {
  return selected.reduce((recorded, contentConfig) => {
    if (!contentConfig.text || isListContentAdded(recorded, contentConfig)) return recorded
    const next = recorded ? `${recorded}${SEPARATOR}${contentConfig.text}` : contentConfig.text
    return next.length <= MAX_LENGTH ? next : recorded
  }, record ?? '')
}
