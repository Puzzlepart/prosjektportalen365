import { Web } from '@pnp/sp/webs'
import { PageContext } from '@microsoft/sp-page-context'
import SPDataAdapter from '../../../data'
import { isHubSite } from 'pp365-shared-library'
import { WebContextMode } from '../types'

/**
 * Get the appropriate web instance based on webContextMode, webUrl and pageContext.
 *
 * Determines which SharePoint web instance to use:
 * - If webContextMode is HubSite, returns the portal web
 * - If webContextMode is CustomSite and webUrl is provided, returns a Web instance for that URL
 * - If webContextMode is CurrentProject or not specified, returns the current web
 * - Falls back to checking if current site is a hub site for backward compatibility
 *
 * @param webUrl Optional web URL to target a specific site (used with CustomSite mode)
 * @param pageContext Optional page context to determine if current site is a hub
 * @param webContextMode Optional mode to determine which web to use
 * @returns Web instance for the appropriate SharePoint site
 */
export function getWeb(
  webUrl?: string,
  pageContext?: PageContext,
  webContextMode?: WebContextMode
) {
  if (webContextMode) {
    if (webContextMode === WebContextMode.HubSite) {
      return SPDataAdapter.portalDataService.web
    } else if (webContextMode === WebContextMode.CustomSite && webUrl) {
      return Web([SPDataAdapter.sp.web, webUrl])
    } else {
      return SPDataAdapter.sp.web
    }
  }

  if (!webUrl) {
    if (pageContext && isHubSite(pageContext)) {
      return SPDataAdapter.portalDataService.web
    }
    return SPDataAdapter.sp.web
  } else {
    return Web([SPDataAdapter.sp.web, webUrl])
  }
}
