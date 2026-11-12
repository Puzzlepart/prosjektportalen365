/**
 * What tells one column of a list from another: its list item id, and its key and field name (the
 * managed property).
 */
export type ColumnIdentity = {
  id?: number
  key?: string
  fieldName?: string
}

/**
 * Whether two columns are the same column: by id when both have one, otherwise by key (or field
 * name). Two columns of a list may show the same managed property, so matched by it alone, the
 * first of them stood in for the other, which was then edited and deleted in its stead.
 */
export function isSameColumn(a: ColumnIdentity, b: ColumnIdentity): boolean {
  if (!a || !b) return false
  if (a.id != null && b.id != null) return a.id === b.id
  const keyA = a.key || a.fieldName
  return !!keyA && keyA === (b.key || b.fieldName)
}

/**
 * The column among `columns` that shows the managed property `fieldName` already, or `undefined`
 * when none does. Case is ignored, as search ignores it in a managed property's name, and so are
 * spaces around the name.
 *
 * @param deletedColumnIds Ids of columns deleted since the columns were read
 */
export function findColumnUsingProperty<T extends ColumnIdentity>(
  fieldName: string,
  columns: T[],
  deletedColumnIds: number[] = []
): T | undefined {
  const normalize = (value: string) => (value ?? '').trim().toLowerCase()
  const property = normalize(fieldName)
  if (!property) return undefined
  return columns.find(
    (column) =>
      !!column && !deletedColumnIds.includes(column.id) && normalize(column.fieldName) === property
  )
}
