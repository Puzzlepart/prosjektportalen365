import { PageContext } from '@microsoft/sp-page-context'

/**
 * Checks if the current site is a hub site (checks pageContext.legacyPageContext)
 *
 * @param pageContext Page context
 */
export function isHubSite({
  legacyPageContext: { siteId, hubSiteId }
}: PageContext) {
  return siteId.indexOf(hubSiteId) !== -1
}
