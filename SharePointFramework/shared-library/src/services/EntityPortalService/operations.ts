import { ISpFieldsShape, ISpListShape } from './pnpShapes'
import { IEntity, IEntityField, IEntityUrls, ISpEntityPortalServiceParams } from './types'

/**
 * Fields selected when reading the entity fields from the entity content type.
 */
export const ENTITY_FIELD_SELECTS = [
  'Id',
  'InternalName',
  'Title',
  'Description',
  'TypeAsString',
  'SchemaXml',
  'TextField',
  'Group'
]

/**
 * Normalizes an entity identity to a bare GUID.
 *
 * SharePoint and the SPFx page context hand out GUIDs both bare (36 characters) and wrapped in
 * curly braces (38 characters), while the entity list stores them bare.
 */
export function normalizeEntityIdentity(identity: string): string {
  if (identity && identity.length === 38) return identity.substring(1, 37)
  return identity
}

/**
 * Escapes a value for use inside a single quoted OData string literal.
 */
export function escapeODataStringLiteral(value: string): string {
  return `${value}`.replace(/'/g, "''")
}

/**
 * Get the fields of the entity content type.
 *
 * Returns an empty array when no content type is configured, and swallows portal errors so
 * that a missing or inaccessible content type degrades to "no fields" rather than failing the
 * caller. Both behaviours are carried over from the original package.
 *
 * An empty array is indistinguishable from a real "no fields" result for the caller, so the
 * swallowed error is handed to `onError` instead of being discarded. The callback is injected
 * rather than imported to keep this module free of logging dependencies.
 *
 * @param fields Field collection of the entity content type, or `null` when not configured
 * @param fieldPrefix Only return fields whose internal name contains this prefix
 * @param onError Called with the error before it is swallowed (optional)
 */
export async function getEntityFields(
  fields: ISpFieldsShape,
  fieldPrefix?: string,
  onError?: (error: Error) => void
): Promise<IEntityField[]> {
  if (!fields) return []
  try {
    let query = fields.select(...ENTITY_FIELD_SELECTS)
    if (fieldPrefix) {
      query = query.filter(`substringof('${escapeODataStringLiteral(fieldPrefix)}', InternalName)`)
    }
    return await query<IEntityField[]>()
  } catch (error) {
    if (onError) onError(error as Error)
    return []
  }
}

/**
 * Get the entity item matching `identity`, or `undefined` when there is no match.
 *
 * Throws on an empty identity. Without the guard the template literal below stringifies
 * `null`/`undefined` into the filter and sends a live `$filter=<field> eq 'null'` query to the
 * portal, which either matches an unrelated item or silently returns nothing.
 *
 * The `top(1)` is load bearing: PnPjs sends no `$top` of its own, so without it SharePoint
 * returns a full default page of items only for the first one to be used.
 *
 * @param list Entity list
 * @param identityFieldName Internal name of the field identifying the entity
 * @param identity Identity of the entity
 */
export async function getEntityItem<T = any>(
  list: ISpListShape,
  identityFieldName: string,
  identity: string
): Promise<T> {
  const normalized = normalizeEntityIdentity(identity)
  if (!normalized) {
    throw new Error(
      `(EntityPortalService) (getEntityItem) No identity given for ${identityFieldName}.`
    )
  }
  const value = escapeODataStringLiteral(normalized)
  const items = await list.items.filter(`${identityFieldName} eq '${value}'`).top(1)<T[]>()
  return items[0]
}

/**
 * Get the field values of an entity item in their text representation.
 *
 * @param list Entity list
 * @param itemId Item ID
 */
export async function getEntityItemFieldValues(
  list: ISpListShape,
  itemId: number
): Promise<Record<string, string>> {
  return await list.items.getById(itemId).fieldValuesAsText<Record<string, string>>()
}

/**
 * Options for `createEntityUrls`.
 */
export interface ICreateEntityUrlsOptions {
  /**
   * Origin of the current page, e.g. `https://contoso.sharepoint.com`.
   */
  origin: string

  /**
   * Absolute URL to the portal site.
   */
  portalUrl: string

  /**
   * ID of the entity list.
   */
  listId: string

  /**
   * Server relative URL of the default edit form of the entity list.
   */
  defaultEditFormUrl: string

  /**
   * ID of the entity item.
   */
  itemId: number

  /**
   * Source URL to return to after editing (optional).
   */
  sourceUrl?: string
}

/**
 * Build the edit form and version history URLs for an entity item.
 */
export function createEntityUrls({
  origin,
  portalUrl,
  listId,
  defaultEditFormUrl,
  itemId,
  sourceUrl
}: ICreateEntityUrlsOptions): IEntityUrls {
  let editFormUrl = `${origin}${defaultEditFormUrl}?ID=${itemId}`
  let versionHistoryUrl = `${portalUrl}/_layouts/15/versions.aspx?list=${listId}&ID=${itemId}`
  if (sourceUrl) {
    const source = `&Source=${encodeURIComponent(sourceUrl)}`
    editFormUrl += source
    // The original package assigned rather than appended here, leaving a bare relative
    // `&Source=...` fragment as the entire version history URL.
    versionHistoryUrl += source
  }
  return { editFormUrl, versionHistoryUrl }
}

/**
 * Get the URLs for an entity item by reading the list metadata.
 *
 * @param list Entity list
 * @param options Everything `createEntityUrls` needs that does not come from the list
 */
export async function getEntityUrls(
  list: ISpListShape,
  options: Omit<ICreateEntityUrlsOptions, 'listId' | 'defaultEditFormUrl'>
): Promise<IEntityUrls> {
  // Select/expand shape preserved from the original package: `DefaultEditFormUrl` is not part
  // of the default list payload, and this is the query known to return it against the portal.
  const { Id, DefaultEditFormUrl } = await list
    .select('DefaultEditFormUrl', 'Id')
    .expand('DefaultEditFormUrl')<{ Id: string; DefaultEditFormUrl: string }>()
  return createEntityUrls({ ...options, listId: Id, defaultEditFormUrl: DefaultEditFormUrl })
}

/**
 * Options for `fetchEntity`.
 */
export interface IFetchEntityOptions extends Pick<
  ISpEntityPortalServiceParams,
  'portalUrl' | 'listName' | 'identityFieldName' | 'fieldPrefix'
> {
  /**
   * Identity of the entity.
   */
  identity: string

  /**
   * Origin of the current page, e.g. `https://contoso.sharepoint.com`.
   */
  origin: string

  /**
   * Source URL to return to after editing (optional).
   */
  sourceUrl?: string

  /**
   * Called with the error when reading the entity content type fields fails (optional). The
   * fields then degrade to an empty array, which is otherwise indistinguishable from a content
   * type without fields.
   */
  onFieldsError?: (error: Error) => void
}

/**
 * Get the entity item, its content type fields, its URLs and its text field values.
 *
 * Throws when no entity matches `identity` - the original package instead let a `TypeError`
 * escape from reading `Id` off `undefined`.
 *
 * @param list Entity list
 * @param fields Field collection of the entity content type, or `null` when not configured
 * @param options Options
 */
export async function fetchEntity(
  list: ISpListShape,
  fields: ISpFieldsShape,
  options: IFetchEntityOptions
): Promise<IEntity> {
  const {
    identity,
    identityFieldName,
    listName,
    portalUrl,
    fieldPrefix,
    origin,
    sourceUrl,
    onFieldsError
  } = options
  const [item, entityFields] = await Promise.all([
    getEntityItem(list, identityFieldName, identity),
    getEntityFields(fields, fieldPrefix, onFieldsError)
  ])
  if (!item) {
    throw new Error(
      `(EntityPortalService) (fetchEntity) No entity found in list '${listName}' where ${identityFieldName} equals '${identity}'.`
    )
  }
  const [urls, fieldValues] = await Promise.all([
    getEntityUrls(list, { origin, portalUrl, itemId: item.Id, sourceUrl }),
    getEntityItemFieldValues(list, item.Id)
  ])
  return { item, fields: entityFields, urls, fieldValues }
}

/**
 * Update the entity item matching `identity`.
 *
 * Throws when no entity matches `identity` - the original package instead let a `TypeError`
 * escape from reading `Id` off `undefined`.
 *
 * Resolves to whatever the endpoint returns. PnPjs 4 no longer wraps responses in
 * `{ data, item }`, so the result must not be unwrapped with `.data`.
 *
 * @param list Entity list
 * @param identityFieldName Internal name of the field identifying the entity
 * @param identity Identity of the entity
 * @param properties Properties to update
 * @param eTag ETag for the `If-Match` header
 */
export async function updateEntityItem<T = any>(
  list: ISpListShape,
  identityFieldName: string,
  identity: string,
  properties: Record<string, any>,
  eTag = '*'
): Promise<T> {
  const item = await getEntityItem(list, identityFieldName, identity)
  if (!item) {
    throw new Error(
      `(EntityPortalService) (updateEntityItem) No entity found where ${identityFieldName} equals '${identity}'.`
    )
  }
  return await list.items.getById(item.Id).update(properties, eTag)
}

/**
 * Build the properties for a new entity item.
 *
 * @param params Identity and URL field names
 * @param identity Identity of the entity
 * @param url Site URL of the entity
 * @param additionalProperties Additional properties
 */
export function createNewEntityProperties(
  params: Pick<ISpEntityPortalServiceParams, 'identityFieldName' | 'urlFieldName'>,
  identity: string,
  url: string,
  additionalProperties?: Record<string, any>
): Record<string, any> {
  const properties: Record<string, any> = {
    [params.identityFieldName]: identity,
    ...additionalProperties
  }
  if (params.urlFieldName) {
    properties[params.urlFieldName] = url
  }
  return properties
}

/**
 * Add a new entity item.
 *
 * Resolves to whatever the endpoint returns. PnPjs 4 no longer wraps responses in
 * `{ data, item }`, so the result must not be unwrapped with `.data`.
 *
 * @param list Entity list
 * @param properties Properties for the new item
 */
export async function addEntityItem<T = any>(
  list: ISpListShape,
  properties: Record<string, any>
): Promise<T> {
  return await list.items.add(properties)
}
