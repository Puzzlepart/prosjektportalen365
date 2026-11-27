import { getContentTypeLineage, isListContentTypeOf } from './contentTypeLineage'

/** A field of a list, as much of it as it takes to add it to another list. */
export interface IListFieldSchema {
  InternalName: string
  Title: string
  SchemaXml: string
  TypeAsString?: string
}

/** A content type of a list, with the names of the fields it links. */
export interface IListContentTypeLinks {
  StringId: string
  FieldLinks?: { Name: string }[]
}

/**
 * What a content type says of a field it links: whether its forms hide the field, and whether an
 * item must have a value in it.
 */
export interface IFieldLinkSettings {
  Name: string
  Hidden?: boolean
  Required?: boolean
}

/**
 * The schema a site column of the project site is made from: that of the hub's own site column
 * of the name, where the hub has one. A field read from a content type carries what that content
 * type says of it, and a field read from a list what the list does. The hub's project content
 * type hides the budget fields a status report fills in: a site column made from its reading of
 * them was hidden in the status report list too, and the report's panel lost four fields.
 *
 * @param field The field, as it was read from the hub's content type or list
 * @param hubSiteColumns The hub's site columns
 */
export function getSiteColumnSchema(
  field: Pick<IListFieldSchema, 'InternalName' | 'SchemaXml'>,
  hubSiteColumns: Pick<IListFieldSchema, 'InternalName' | 'SchemaXml'>[]
): string {
  const siteColumn = (hubSiteColumns ?? []).find(
    (column) => column?.InternalName === field.InternalName && !!column.SchemaXml
  )
  return siteColumn?.SchemaXml ?? field.SchemaXml
}

/**
 * Whether a field's schema says the field is hidden. Read from a content type, it says so both
 * for a site column that is hidden itself and for one the content type hides in its forms.
 *
 * @param field The field
 */
export function isHiddenInSchema(field: { SchemaXml?: string }): boolean {
  const [fieldElement] = `${field?.SchemaXml ?? ''}`.split('>')
  return /\sHidden="TRUE"/i.test(fieldElement)
}

/**
 * Whether the hub's content type hides a field in its forms that is not hidden itself: the hub's
 * project content type does so with the budget fields, which a status report fills in. A field
 * read from a content type says it is hidden in both cases; the hub's own site column tells them
 * apart. Without the hub's site column, the field counts as hidden itself.
 *
 * @param field The field, as it was read from the hub's content type
 * @param hubSiteColumns The hub's site columns
 */
export function isHiddenByContentType(
  field: Pick<IListFieldSchema, 'InternalName' | 'SchemaXml'>,
  hubSiteColumns: Pick<IListFieldSchema, 'InternalName' | 'SchemaXml'>[]
): boolean {
  if (!isHiddenInSchema(field)) return false
  const siteColumn = (hubSiteColumns ?? []).find(
    (column) => column?.InternalName === field.InternalName && !!column.SchemaXml
  )
  return !!siteColumn && !isHiddenInSchema(siteColumn)
}

/**
 * The links of a list's copy of a content type that say something else of their field than the
 * hub's content type does, with what they are to say. A link SharePoint makes when a field is
 * added to a list says what the field does, not what the content type does: the status report
 * list's own copy required the title, showed it in the report's panel, and required none of the
 * status fields.
 *
 * @param hubLinks The field links of the hub's content type
 * @param listLinks The field links of the list's copy of the content type
 */
export function getFieldLinkChanges(
  hubLinks: IFieldLinkSettings[],
  listLinks: IFieldLinkSettings[]
): Required<IFieldLinkSettings>[] {
  const wanted = new Map((hubLinks ?? []).map((link) => [link.Name, link]))
  return (listLinks ?? [])
    .filter(({ Name, Hidden, Required }) => {
      const hubLink = wanted.get(Name)
      return !!hubLink && (!!hubLink.Hidden !== !!Hidden || !!hubLink.Required !== !!Required)
    })
    .map(({ Name }) => ({
      Name,
      Hidden: !!wanted.get(Name).Hidden,
      Required: !!wanted.get(Name).Required
    }))
}

/**
 * The names of the fields a list's own copy of a content type links. A list can give its copy
 * columns the content type itself lacks: the hub's list for status reports gives it those
 * PP-assistenten writes its analysis of a report to. Where the list has no copy of the content
 * type itself, its copy of the closest content type that one is built on answers; where it has
 * none of those either, nothing. Another content type of the list is never asked: its columns
 * are another template's.
 *
 * @param listContentTypes The list's content types, with their field links
 * @param contentTypeId ID of the site content type
 */
export function getListContentTypeFieldNames(
  listContentTypes: IListContentTypeLinks[],
  contentTypeId: string
): string[] {
  for (const id of getContentTypeLineage(contentTypeId).reverse()) {
    const copy = (listContentTypes ?? []).find(({ StringId }) => isListContentTypeOf(StringId, id))
    if (copy) return (copy.FieldLinks ?? []).map(({ Name }) => Name)
  }
  return []
}

/**
 * The fields a hub list has given its copy of a content type beyond the content type's own, in
 * the list's order. A lookup is left out: it looks up in a list on the hub, which a list on the
 * project site cannot.
 *
 * @param hubListFields The hub list's fields
 * @param linkedNames Internal names of the fields the list's copy of the content type links
 * @param contentTypeFieldNames Internal names of the content type's own fields
 */
export function getListOwnFields<T extends Pick<IListFieldSchema, 'InternalName' | 'TypeAsString'>>(
  hubListFields: T[],
  linkedNames: string[],
  contentTypeFieldNames: string[]
): T[] {
  const linked = new Set(linkedNames ?? [])
  const own = new Set(contentTypeFieldNames ?? [])
  return (hubListFields ?? []).filter(
    (field) =>
      !!field?.InternalName &&
      linked.has(field.InternalName) &&
      !own.has(field.InternalName) &&
      !`${field.TypeAsString ?? ''}`.startsWith('Lookup')
  )
}
