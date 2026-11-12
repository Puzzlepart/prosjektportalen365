import { Web } from '@pnp/sp/webs'
import SPDataAdapter from '../../../data'
import { WebContextMode } from '../types'

/** Resolves the current, hub or explicitly configured web containing the list. */
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
