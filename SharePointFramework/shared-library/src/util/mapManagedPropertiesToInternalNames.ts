const MANAGED_PROPERTY_SUFFIX = /OWS(NMBR|CHCS|BOOL|TEXT|DATE|MTXT|MJSN|USER)$/

/**
 * Returns a copy of a search result with internal name keys added alongside the
 * managed property keys, so that field references and display templates written
 * for list items (e.g. `GtRiskProbability`) also resolve for search results
 * (e.g. `GtRiskProbabilityOWSNMBR`).
 *
 * An explicit map (typically built from a data source's columns and refiners:
 * `fieldName` -> `internalName`) takes precedence; stripping a well-known
 * managed property suffix is the fallback. Existing keys are never overwritten.
 *
 * @param searchResult Search result to map
 * @param fieldNameMap Map of managed property names to internal names
 */
export function mapManagedPropertiesToInternalNames(
  searchResult: Record<string, any>,
  fieldNameMap: Map<string, string> = new Map()
): Record<string, any> {
  return Object.keys(searchResult).reduce(
    (item, key) => {
      const internalName =
        fieldNameMap.get(key) ??
        (MANAGED_PROPERTY_SUFFIX.test(key) ? key.replace(MANAGED_PROPERTY_SUFFIX, '') : null)
      if (internalName && item[internalName] === undefined) {
        item[internalName] = searchResult[key]
      }
      return item
    },
    { ...searchResult }
  )
}
