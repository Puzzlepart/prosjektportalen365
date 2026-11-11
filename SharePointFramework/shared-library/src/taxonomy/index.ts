/**
 * SharePoint term store client, replacing `@pnp/sp/taxonomy` from PnPjs v3.
 *
 * The export list is curated rather than a wildcard: the low level queryable
 * factories (`TermStore`, `TermSets`, `TermSet`, `Terms`, `Term`) and the paging and
 * path primitives are implementation detail, are only needed when extending this
 * module, and carry names that would be too generic for the package root barrel.
 * Import them from `pp365-shared-library/lib/taxonomy/termStore` when needed.
 */
export {
  getLocalizedProperty,
  getLocalProperties,
  getLocalProperty,
  getTermLabel,
  TERM_LABEL_FALLBACK_LANGUAGE_TAGS
} from './localProperties'
export { DEFAULT_TERM_PAGE_SIZE } from './paging'
export { getTermStore, ITerm, ITerms, ITermSet, ITermSets, ITermStore } from './termStore'
export * from './types'
