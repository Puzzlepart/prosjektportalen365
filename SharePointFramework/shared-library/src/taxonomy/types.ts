/**
 * Data contracts for the SharePoint term store REST surface (`_api/v2.1/termstore`).
 *
 * Ported from `@pnp/sp@3` `taxonomy/types`, which was dropped in PnPjs v4. The field
 * names are kept identical to v3 so that consuming models only need to change the
 * import path. This file intentionally has no imports at all: it is pure type
 * information and must not drag the ESM-only `@pnp/*` packages into anything that
 * consumes it.
 *
 * Note that this is the *SharePoint* term store, not the Microsoft Graph one. Only
 * the SharePoint surface exposes `localProperties` (per term set custom properties),
 * which Prosjektportalen relies on for `PhaseLetter`, `PhaseSubText`, `Archiveable`
 * and friends provisioned through `Templates/Taxonomy/Taxonomy.xml`.
 */

/**
 * A single custom property (key/value pair) on a term, term set or group.
 */
export interface ITaxonomyProperty {
  key: string
  value: string
}

/**
 * Custom properties scoped to one term set. A term that is reused across several
 * term sets has one entry per set, which is why every lookup needs a term set ID.
 */
export interface ITaxonomyLocalProperty {
  setId: string
  properties: ITaxonomyProperty[]
}

/**
 * A localized label on a term. Exactly one label per language is the default label.
 */
export interface ITermLabelInfo {
  name: string
  isDefault: boolean
  languageTag: string
}

/**
 * A localized description on a term.
 */
export interface ITermDescriptionInfo {
  description: string
  languageTag: string
}

/**
 * A localized name on a term set or group.
 */
export interface ILocalizedNameInfo {
  name: string
  languageTag: string
}

/**
 * Per term set tagging availability for a term.
 */
export interface ITermAvailabilityInfo {
  setId: string
  isAvailable: boolean
}

/**
 * Custom sort order for the children of a term, scoped to one term set.
 */
export interface ITermSortOrderInfo {
  setId: string
  order: string[]
}

/**
 * A pin/reuse relation between terms.
 */
export interface IRelationInfo {
  id: string
  relationType: string
}

/**
 * A term store administrator.
 */
export interface ITaxonomyUserInfo {
  user: {
    displayName: string
    email: string
    id: string
  }
}

/**
 * The term store itself. Reading this is also the cheapest way to probe whether the
 * current user can reach the term store at all.
 */
export interface ITermStoreInfo {
  id: string
  name: string
  defaultLanguageTag: string
  languageTags: string[]
  administrators?: ITaxonomyUserInfo
}

/**
 * A term group. Groups are provisioned through JSOM in Prosjektportalen, so this is
 * only used for reading.
 */
export interface ITermGroupInfo {
  id: string
  description: string
  name: string
  displayName: string
  createdDateTime: string
  lastModifiedDateTime: string
  type: string
  scope: 'global' | 'system' | 'siteCollection'
}

/**
 * A term set. Note that most properties are only populated when they are part of the
 * `$select`, so callers that narrow the selection get a partially filled object.
 */
export interface ITermSetInfo {
  id: string
  localizedNames: ILocalizedNameInfo[]
  description: string
  createdDateTime: string
  customSortOrder?: string[]
  properties?: ITaxonomyProperty[]
  childrenCount: number
  groupId: string
  isOpen: boolean
  isAvailableForTagging: boolean
  contact: string
}

/**
 * A term. `localProperties` is only returned when explicitly selected, hence the
 * `select('*', 'localProperties')` calls throughout Prosjektportalen.
 */
export interface ITermInfo {
  id: string
  childrenCount: number
  labels: ITermLabelInfo[]
  createdDateTime: string
  lastModifiedDateTime: string
  descriptions: ITermDescriptionInfo[]
  customSortOrder?: ITermSortOrderInfo[]
  properties?: ITaxonomyProperty[]
  localProperties?: ITaxonomyLocalProperty[]
  isDeprecated: boolean
  isAvailableForTagging: ITermAvailabilityInfo[]
  topicRequested?: boolean
  parent?: ITermInfo
  set?: ITermSetInfo
  relations?: IRelationInfo[]
  children?: ITermInfo[]
}
