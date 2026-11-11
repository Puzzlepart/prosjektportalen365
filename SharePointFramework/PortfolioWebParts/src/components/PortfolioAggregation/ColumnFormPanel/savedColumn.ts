import { ProjectContentColumn, SPProjectContentColumnItem } from 'pp365-shared-library'

/**
 * The column the overview holds after a save. A new column is made from the saved fields. An
 * edited column is the column the form opened with, its edited properties replaced: made afresh
 * from the saved fields, it lost what the form does not edit (the lock, sort state, whether an
 * idea copies it to processing, and whether it can be grouped by when the switch was not used)
 * until the page was loaded again.
 *
 * @param columnItem The fields saved to the list
 * @param original The column the form edited, for an edited column
 */
export function savedColumn(
  columnItem: SPProjectContentColumnItem,
  original?: ProjectContentColumn
): ProjectContentColumn {
  const saved = new ProjectContentColumn(columnItem)
  if (!original) return saved
  const isGroupable = columnItem.GtIsGroupable ?? original.data?.isGroupable ?? original.isGroupable
  const column = Object.assign(new ProjectContentColumn(), original, {
    name: saved.name,
    minWidth: saved.minWidth,
    maxWidth: saved.maxWidth,
    dataType: saved.dataType,
    isMultiline: saved.isMultiline,
    isGroupable
  })
  column.data = {
    ...original.data,
    dataTypeProperties: saved.data.dataTypeProperties,
    renderAs: saved.data.renderAs,
    isGroupable
  }
  return column
}
