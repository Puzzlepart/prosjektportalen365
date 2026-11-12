import { IWeb } from '@pnp/sp/webs'

/**
 * Pairs a hub site's URL with its SharePoint web client.
 */
export interface IHubSite {
  url: string
  web: IWeb
}
