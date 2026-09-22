import '@pnp/sp/presets/all'
import { IContentType, IList, IWeb, SPFI, SPFx, spfi } from '@pnp/sp/presets/all'
import { SPFxContext } from '../../types'
import {
  addEntityItem,
  createNewEntityProperties,
  fetchEntity,
  getEntityFields,
  getEntityItem,
  updateEntityItem
} from './operations'
import { ISpFieldsShape, ISpListShape } from './pnpShapes'
import { IEntity, IEntityField, ISpEntityPortalServiceParams } from './types'

/**
 * Reads and writes project entities in the portal (hub) site.
 *
 * Vendored from the npm package `sp-entityportal-service` v2.3.0 (MIT) and ported to PnPjs 4.
 * See the attribution header in `types.ts` in this folder.
 *
 * The class only owns the PnPjs wiring. Every operation lives in `operations.ts`, typed against
 * the structural shapes in `pnpShapes.ts`, so the behaviour is unit testable without the
 * (ESM only) PnPjs runtime.
 */
export class SpEntityPortalService {
  public sp: SPFI
  public web: IWeb
  private _entityList: IList
  private _entityContentType: IContentType

  /**
   * Construct a new `SpEntityPortalService` instance.
   *
   * @param _spfxContext SPFx context
   * @param _params Parameters
   */
  constructor(
    private _spfxContext: SPFxContext,
    private _params: ISpEntityPortalServiceParams
  ) {
    this.sp = spfi(_params.portalUrl).using(SPFx(_spfxContext))
    this.web = this.sp.web
    this._entityList = this.web.lists.getByTitle(_params.listName)
    this._entityContentType = _params.contentTypeId
      ? this.web.contentTypes.getById(_params.contentTypeId)
      : null
  }

  /**
   * Returns a new instance of the service with `params` merged into the current parameters.
   *
   * @param params Parameters to override
   */
  public usingParams(params: Partial<ISpEntityPortalServiceParams>): SpEntityPortalService {
    return new SpEntityPortalService(this._spfxContext, { ...this._params, ...params })
  }

  /**
   * Get the entity item, its content type fields, its URLs and its text field values.
   *
   * @param identity Identity of the entity
   * @param sourceUrl Source URL used when generating the URLs
   * @param onFieldsError Called when reading the entity content type fields fails (optional)
   */
  public fetchEntity(
    identity: string,
    sourceUrl: string,
    onFieldsError?: (error: Error) => void
  ): Promise<IEntity> {
    return fetchEntity(this._list, this._contentTypeFields, {
      identity,
      sourceUrl,
      onFieldsError,
      origin: `${window.location.protocol}//${window.location.hostname}`,
      portalUrl: this._params.portalUrl,
      listName: this._params.listName,
      identityFieldName: this._params.identityFieldName,
      fieldPrefix: this._params.fieldPrefix
    })
  }

  /**
   * Get the fields of the entity content type. Returns an empty array when the service was
   * constructed without a `contentTypeId`.
   *
   * @param onError Called when the portal query fails, before the error is swallowed (optional)
   */
  public getEntityFields(onError?: (error: Error) => void): Promise<IEntityField[]> {
    return getEntityFields(this._contentTypeFields, this._params.fieldPrefix, onError)
  }

  /**
   * Get the entity item matching `identity`, or `undefined` when there is no match.
   *
   * @param identity Identity of the entity
   */
  public getEntityItem<T = any>(identity: string): Promise<T> {
    return getEntityItem<T>(this._list, this._params.identityFieldName, identity)
  }

  /**
   * Update the entity item matching `identity`.
   *
   * Resolves to whatever the endpoint returns - PnPjs 4 does not wrap responses in `{ data }`.
   *
   * @param identity Identity of the entity
   * @param properties Properties to update
   * @param eTag ETag for the `If-Match` header
   */
  public updateEntityItem<T = any>(
    identity: string,
    properties: Record<string, any>,
    eTag = '*'
  ): Promise<T> {
    return updateEntityItem<T>(
      this._list,
      this._params.identityFieldName,
      identity,
      properties,
      eTag
    )
  }

  /**
   * Create a new entity item.
   *
   * Resolves to whatever the endpoint returns - PnPjs 4 does not wrap responses in `{ data }`.
   *
   * @param identity Identity of the entity
   * @param url Site URL of the entity
   * @param additionalProperties Additional properties for the new item
   */
  public createNewEntity<T = any>(
    identity: string,
    url: string,
    additionalProperties?: Record<string, any>
  ): Promise<T> {
    const properties = createNewEntityProperties(this._params, identity, url, additionalProperties)
    return addEntityItem<T>(this._list, properties)
  }

  /**
   * The entity list seen through the minimal shape the operations are typed against.
   */
  private get _list(): ISpListShape {
    return this._entityList
  }

  /**
   * The fields of the entity content type, or `null` when no content type is configured.
   */
  private get _contentTypeFields(): ISpFieldsShape {
    return this._entityContentType ? this._entityContentType.fields : null
  }
}
