/**
 * Vendored from the npm package `sp-entityportal-service` v2.3.0 (MIT licensed, published
 * 2023-08-07 by npm maintainer `olemp` <olemp@puzzlepart.com>, Puzzlepart).
 *
 * The package declares no repository, homepage or issue tracker, has had no release since
 * 2023 and pins `@pnp/sp` 3.9.0, so it could neither be upgraded for the PnPjs 4 migration
 * nor forked upstream. The relevant sources were therefore vendored into this repository and
 * ported to PnPjs 4. Original authorship belongs to the package maintainer above.
 */

/**
 * Parameters for `SpEntityPortalService`.
 */
export interface ISpEntityPortalServiceParams {
  /**
   * Absolute URL to the portal (hub) site holding the entity list.
   */
  portalUrl: string

  /**
   * Title of the list holding the entities.
   */
  listName: string

  /**
   * Internal name of the field that identifies an entity, e.g. `GtSiteId` or `GtGroupId`.
   */
  identityFieldName: string

  /**
   * Internal name of the field holding the site URL of the entity.
   */
  urlFieldName: string

  /**
   * Only return entity fields whose internal name contains this prefix (optional).
   */
  fieldPrefix?: string

  /**
   * Content type ID used to resolve the entity fields (optional). Without it
   * `getEntityFields` returns an empty array.
   */
  contentTypeId?: string
}

/**
 * A field on the entity content type, as selected by `SpEntityPortalService.getEntityFields`.
 */
export interface IEntityField {
  Id?: string
  Title?: string
  Description?: string
  InternalName?: string
  TypeAsString?: string
  TextField?: string
  SchemaXml?: string
  Group?: string
}

/**
 * URLs pointing back to the entity item in the portal site.
 */
export interface IEntityUrls {
  /**
   * Edit form URL for the entity.
   */
  editFormUrl: string

  /**
   * Version history URL for the entity.
   */
  versionHistoryUrl: string
}

/**
 * The full entity as returned by `SpEntityPortalService.fetchEntity`.
 */
export interface IEntity {
  /**
   * The raw list item.
   */
  item: Record<string, any>

  /**
   * Fields on the entity content type.
   */
  fields: IEntityField[]

  /**
   * URLs pointing back to the item in the portal site.
   */
  urls: IEntityUrls

  /**
   * Field values in their text representation (`FieldValuesAsText`).
   */
  fieldValues: Record<string, string>
}
