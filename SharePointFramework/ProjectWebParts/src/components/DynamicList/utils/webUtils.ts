import { Web } from '@pnp/sp/webs'
import SPDataAdapter from '../../../data'
import { WebContextMode } from '../types'

/**
 * Get the appropriate web instance based on webContextMode and webUrl.
 *
 * Determines which SharePoint web instance to use:
 * - If webContextMode is HubSite, returns the portal web (hub site)
 * - If webContextMode is CustomSite and webUrl is provided, returns a Web instance for that URL
 * - If webContextMode is CurrentProject or not specified, returns the current web
 *
 * @param webUrl Optional web URL to target a specific site (used with CustomSite mode)
 * @param webContextMode Optional mode to determine which web to use (defaults to CurrentProject)
 * @returns Web instance for the appropriate SharePoint site
 */
export function getWeb(webUrl?: string, webContextMode?: WebContextMode) {
  const mode = webContextMode || WebContextMode.CurrentProject

  if (mode === WebContextMode.HubSite) {
    return SPDataAdapter.portalDataService.web
  } else if (mode === WebContextMode.CustomSite && webUrl) {
    return Web([SPDataAdapter.sp.web, webUrl])
  } else {
    return SPDataAdapter.sp.web
  }
}
