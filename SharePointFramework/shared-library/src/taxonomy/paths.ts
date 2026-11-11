/**
 * Path segments and GUID handling for the SharePoint term store REST surface.
 *
 * The segments are returned as arrays rather than joined strings so that the actual
 * URL is always assembled by PnPjs' `combine`, and so that this module can stay free
 * of imports. Keeping it import-free matters: the `@pnp/*` v4 packages are ESM only
 * and cannot be loaded by the CommonJS Jest runner the Heft rig configures, so any
 * logic that needs unit test coverage has to live outside the PnPjs import graph.
 */

/** Root path of the SharePoint term store REST API, relative to a web URL. */
export const TERM_STORE_API_PATH = '_api/v2.1/termstore'

/** Path segment for the term set collection. */
export const TERM_SETS_PATH = 'sets'

/** Path segment for a term collection. */
export const TERMS_PATH = 'terms'

/**
 * Normalizes a term store GUID for use in URLs and comparisons. Registered term set
 * IDs reach us from provisioning templates and web part properties, where they are
 * commonly wrapped in braces or padded with whitespace, neither of which the REST
 * API accepts.
 *
 * @returns The bare GUID, or an empty string when there is nothing usable
 */
export function normalizeTermGuid(value: string): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/^\{/, '').replace(/\}$/, '').trim()
}

/**
 * Compares two term store GUIDs. The term store is inconsistent about casing
 * between `localProperties[].setId` and the IDs configured in the hub site, so
 * comparison has to be case insensitive and brace insensitive.
 */
export function isSameTermGuid(a: string, b: string): boolean {
  const left = normalizeTermGuid(a)
  const right = normalizeTermGuid(b)
  if (!left || !right) return false
  return left.toLowerCase() === right.toLowerCase()
}

/**
 * Builds the single URL segment addressing a term set or term by ID.
 *
 * Throws rather than building a URL that would fail as an opaque `400` from the term
 * store, since an empty ID here always means a misconfigured term set property.
 */
export function termIdSegment(id: string): string {
  const normalized = normalizeTermGuid(id)
  if (!normalized) {
    throw new Error(`Invalid term store ID: '${String(id)}'`)
  }
  return encodeURIComponent(normalized)
}

/**
 * Builds the segments addressing a term below a term set (`terms/{id}`).
 */
export function termSegments(termId: string): string[] {
  return [TERMS_PATH, termIdSegment(termId)]
}

/**
 * Builds the segments addressing a term set below the term store (`sets/{id}`).
 */
export function termSetSegments(termSetId: string): string[] {
  return [TERM_SETS_PATH, termIdSegment(termSetId)]
}

/**
 * Joins path segments into the relative path a queryable is chained on.
 *
 * Empty segments are dropped so that a joined path never contains the double slash
 * that the term store answers with a `400`.
 */
export function joinSegments(segments: string[]): string {
  return (segments ?? []).filter((segment) => !!segment).join('/')
}
