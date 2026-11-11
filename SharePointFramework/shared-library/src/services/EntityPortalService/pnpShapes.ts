/**
 * Minimal structural views of the PnPjs surface used by the entity portal operations.
 *
 * The operations in `operations.ts` are typed against these interfaces rather than against
 * `@pnp/sp` directly. Real PnPjs objects satisfy them structurally, and the unit tests can
 * satisfy them with small hand-rolled fakes without pulling the (ESM-only) PnPjs runtime into
 * the CommonJS Jest environment.
 */

/**
 * A PnPjs queryable is invoked as a function to execute the request.
 */
export interface ISpInvokable {
  <T = any>(init?: RequestInit): Promise<T>
}

/**
 * The subset of `IItem` used when reading and updating a single entity item.
 */
export interface ISpItemShape {
  /**
   * Field values in their text representation. Invoked as a function.
   */
  readonly fieldValuesAsText: ISpInvokable

  /**
   * Updates the item. In PnPjs 4 this resolves to what the endpoint returns, not `{ data }`.
   */
  update(properties: Record<string, any>, eTag?: string): Promise<any>
}

/**
 * The subset of `IItems` used when querying, adding and addressing entity items.
 */
export interface ISpItemsShape extends ISpInvokable {
  filter(filter: string): ISpItemsShape
  top(top: number): ISpItemsShape
  select(...selects: string[]): ISpItemsShape
  getById(id: number): ISpItemShape

  /**
   * Adds an item. In PnPjs 4 this resolves to what the endpoint returns, not `{ data, item }`.
   */
  add(properties?: Record<string, any>): Promise<any>
}

/**
 * The subset of `IList` used to read list metadata and reach the items collection.
 */
export interface ISpListShape extends ISpInvokable {
  readonly items: ISpItemsShape
  select(...selects: string[]): ISpListShape
  expand(...expands: string[]): ISpListShape
}

/**
 * The subset of a field collection (`IContentType.fields`) used to read entity fields.
 */
export interface ISpFieldsShape extends ISpInvokable {
  select(...selects: string[]): ISpFieldsShape
  filter(filter: string): ISpFieldsShape
}
