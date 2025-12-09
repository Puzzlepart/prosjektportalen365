import { Web } from '@pnp/sp/webs'
import { PageContext } from '@microsoft/sp-page-context'
import SPDataAdapter from '../../../data'
import { isHubSite } from 'pp365-shared-library'

/**
 * Get the appropriate web instance based on webUrl and pageContext.
 *
 * Determines which SharePoint web instance to use:
 * - If no webUrl provided and current site is a hub site, returns the portal web
 * - If no webUrl provided and not a hub site, returns the current web
 * - If webUrl is provided, creates and returns a Web instance for that URL
 *
 * @param webUrl Optional web URL to target a specific site
 * @param pageContext Optional page context to determine if current site is a hub
 * @returns Web instance for the appropriate SharePoint site
 */
export function getWeb(webUrl?: string, pageContext?: PageContext) {
  if (!webUrl) {
    if (pageContext && isHubSite(pageContext)) {
      return SPDataAdapter.portalDataService.web
    }
    return SPDataAdapter.sp.web
  } else {
    return Web([SPDataAdapter.sp.web, webUrl])
  }
}
