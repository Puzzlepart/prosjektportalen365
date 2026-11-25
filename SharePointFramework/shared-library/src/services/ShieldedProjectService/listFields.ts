/** A field of a list, as much of it as it takes to add it to another list. */
export interface IListFieldSchema {
  InternalName: string
  Title: string
  SchemaXml: string
  TypeAsString?: string
}

/**
 * The fields of a hub list that the project site's list of the same name lacks. A lookup is left
 * out: it looks up in a list on the hub, which a list on the project site cannot.
 *
 * @param hubFields The hub list's fields
 * @param listFieldNames Internal names of the fields the project site's list has
 */
export function getMissingListFields<
  T extends Pick<IListFieldSchema, 'InternalName' | 'TypeAsString'>
>(hubFields: T[], listFieldNames: string[]): T[] {
  const inList = new Set(listFieldNames ?? [])
  return (hubFields ?? []).filter(
    (field) =>
      !!field?.InternalName &&
      !inList.has(field.InternalName) &&
      !`${field.TypeAsString ?? ''}`.startsWith('Lookup')
  )
}
