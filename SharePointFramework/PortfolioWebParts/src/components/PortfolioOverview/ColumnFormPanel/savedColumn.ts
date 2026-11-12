import { ProjectColumn, SPProjectColumnItem } from 'pp365-shared-library'

/**
 * The column the overview holds after a save. A new column is made from the saved fields. An
 * edited column is the column the form opened with, its edited properties replaced: made afresh
 * from the saved fields, it lost what the form does not edit (the column's configuration of colors
 * and icons, custom sorts, field overrides and sort state, and whether it can be grouped by when
 * the switch was not used) until the page was loaded again.
 *
 * @param original The column the form edited, for an edited column
 */
export function savedColumn(
  columnItem: SPProjectColumnItem,
  original?: ProjectColumn
): ProjectColumn {
  const saved = new ProjectColumn(columnItem)
  if (!original) return saved
  const column = Object.assign(new ProjectColumn(), original, {
    name: saved.name,
    sortOrder: saved.sortOrder,
    minWidth: saved.minWidth,
    maxWidth: saved.maxWidth,
    dataType: saved.dataType,
    isMultiline: saved.isMultiline,
    isRefinable: saved.isRefinable
  })
  column.data = {
    ...original.data,
    visibility: saved.data.visibility,
    dataTypeProperties: saved.data.dataTypeProperties,
    isGroupable: columnItem.GtIsGroupable ?? original.data?.isGroupable
  }
  return column
}
