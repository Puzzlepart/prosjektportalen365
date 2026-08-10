/**
 * Builds one or more search query fragments consisting of `<queryProperty>:<siteId>` terms,
 * chunked to avoid the 4096 character query limitation in SharePoint search.
 *
 * @param siteIds Site IDs to build query fragments for
 * @param queryProperty Managed property to query site IDs with (e.g. `SiteId` or `GtSiteIdOWSTEXT`)
 * @param maxQueryLength Maximum length of query before pushing to array (default: 2500)
 * @param maxProjects Maximum projects required before chunking the query (default: 25)
 */
export function buildAggregatedSiteIdQueries(
  siteIds: string[],
  queryProperty: string,
  maxQueryLength: number = 2500,
  maxProjects: number = 25
): string[] {
  if (!siteIds?.length) return []
  const aggregatedQueries: string[] = []
  let queryString = ''
  if (siteIds.length > maxProjects) {
    siteIds.forEach((siteId, index) => {
      queryString += `${queryProperty}:${siteId} `
      if (queryString.length > maxQueryLength) {
        aggregatedQueries.push(queryString)
        queryString = ''
      }
      if (index === siteIds.length - 1) {
        aggregatedQueries.push(queryString)
      }
    })
  } else {
    siteIds.forEach((siteId) => {
      queryString += `${queryProperty}:${siteId} `
    })
    aggregatedQueries.push(queryString)
  }
  return aggregatedQueries.filter(Boolean)
}
