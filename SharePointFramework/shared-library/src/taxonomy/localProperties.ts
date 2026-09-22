import { isSameTermGuid } from './paths'
import type { ITermInfo, ITaxonomyProperty } from './types'

/**
 * Readers for the parts of a term that Prosjektportalen models depend on: the
 * per term set custom properties (`localProperties`) and the localized label.
 *
 * These live here rather than inside the models so that they can be unit tested
 * without loading the ESM-only `@pnp/*` packages, and so that the three models that
 * currently duplicate the same `_.find(...)` destructuring share one implementation.
 * The duplicated version throws a `TypeError` when the term carries no entry for the
 * requested term set (destructuring `undefined`); this one returns an empty object.
 */

/** A term narrowed to just the fields these readers touch. */
export type ITermWithLocalProperties = Pick<ITermInfo, 'localProperties'>

/** A term narrowed to just its labels. */
export type ITermWithLabels = Pick<ITermInfo, 'labels'>

/**
 * Gets the custom properties a term carries within a specific term set, as a plain
 * key/value record.
 *
 * @param term Term as returned by `select('*', 'localProperties')`
 * @param termSetId Term set the properties are scoped to
 * @returns The properties, or an empty record when the term has none for that set
 */
export function getLocalProperties(
  term: ITermWithLocalProperties,
  termSetId: string
): Record<string, string> {
  const result: Record<string, string> = {}
  const localProperties = term?.localProperties
  if (!localProperties) return result
  const match = localProperties.filter((p) => p && isSameTermGuid(p.setId, termSetId))[0]
  const properties: ITaxonomyProperty[] = match?.properties
  if (!properties) return result
  for (const property of properties) {
    if (property && typeof property.key === 'string') result[property.key] = property.value
  }
  return result
}

/**
 * Gets a single custom property a term carries within a specific term set.
 *
 * @returns The value, or `undefined` when the property is not set
 */
export function getLocalProperty(
  term: ITermWithLocalProperties,
  termSetId: string,
  key: string
): string | undefined {
  return readProperty(getLocalProperties(term, termSetId), key)
}

/**
 * Language tags every label lookup falls back to, in order.
 *
 * Norwegian is the preferred language of Prosjektportalen and every term provisioned from
 * `Templates/Taxonomy/Taxonomy.xml` carries an `nb-NO` label. English is supported for tenants
 * that run an English instance, so it is tried next. The chain is fixed on purpose: before the
 * PnPjs 4 migration the models and `SPDataAdapterBase.getTerms` each had their own fallback
 * rules, and the product decision is that every label lookup behaves the same way.
 */
export const TERM_LABEL_FALLBACK_LANGUAGE_TAGS: readonly string[] = ['nb-NO', 'en-US']

/**
 * Gets the label for a term.
 *
 * Tries the requested language first, then steps through
 * `TERM_LABEL_FALLBACK_LANGUAGE_TAGS` (`nb-NO`, then `en-US`), and finally falls back to
 * the term's first label so a term that only carries some other language still gets a name.
 *
 * Pass the language of the current web (for example `supportedLocalesMap.get(web.Language)`)
 * as `languageTag`. On a Norwegian web the chain is nb-NO, en-US, first label; on an English
 * web it is en-US, nb-NO, first label.
 *
 * @param languageTag Requested language, compared case insensitively; may be `undefined`
 * @returns The label, or an empty string when the term has no labels at all
 */
export function getTermLabel(term: ITermWithLabels, languageTag?: string): string {
  const labels = term?.labels
  if (!labels || labels.length === 0) return ''
  for (const candidate of [languageTag, ...TERM_LABEL_FALLBACK_LANGUAGE_TAGS]) {
    const label = findLabel(labels, candidate)
    if (label !== undefined) return label
  }
  return labels[0]?.name ?? ''
}

/**
 * Finds the label for a language tag, preferring the default label when a language
 * has several labels (synonyms).
 */
function findLabel(labels: ITermInfo['labels'], languageTag: string): string | undefined {
  if (!languageTag) return undefined
  const matches = labels.filter(
    (l) => l && (l.languageTag ?? '').toLowerCase() === languageTag.toLowerCase()
  )
  if (matches.length === 0) return undefined
  return (matches.filter((l) => l.isDefault)[0] ?? matches[0]).name
}

/**
 * Gets a custom property, preferring a language suffixed variant.
 *
 * Prosjektportalen provisions localized variants of phase properties as
 * `<Key>_<languageTag>` (for example `PhaseSubText_nb-no`) alongside an unsuffixed
 * default, which is the lookup `ProjectPhaseModel` performs for every phase.
 * Matching is case insensitive because the suffix casing in `Taxonomy.xml` does not
 * have to agree with the language tag the web reports.
 *
 * @param languageTag Language tag, for example `nb-no`
 * @returns The localized value, the unsuffixed value, or `undefined`
 */
export function getLocalizedProperty(
  term: ITermWithLocalProperties,
  termSetId: string,
  key: string,
  languageTag: string
): string | undefined {
  const properties = getLocalProperties(term, termSetId)
  if (languageTag) {
    const localized = readProperty(properties, key + '_' + languageTag)
    if (localized !== undefined) return localized
  }
  return readProperty(properties, key)
}

/**
 * Reads a property by key, falling back to a case insensitive match.
 *
 * Presence is tested against `undefined` rather than truthiness: a property
 * provisioned with an empty value is set, and reading it as absent would make
 * `getLocalizedProperty` fall through to the unsuffixed default, resurrecting the
 * value a deliberately blank localized override was provisioned to suppress.
 */
function readProperty(properties: Record<string, string>, key: string): string | undefined {
  const exact = properties[key]
  if (exact !== undefined) return exact
  const lowered = key.toLowerCase()
  for (const candidate of Object.keys(properties)) {
    if (candidate.toLowerCase() === lowered && properties[candidate] !== undefined) {
      return properties[candidate]
    }
  }
  return undefined
}
