import { LogLevel } from '@pnp/logging'
import { IHubSiteContext } from 'sp-hubsite-service'

export interface ISPDataAdapterBaseConfiguration {
  /**
   * Web URL
   */
  webUrl: string

  /**
   * Site ID
   */
  siteId: string

  /**
   * Hub site context
   */
  hubSiteContext: IHubSiteContext

  /**
   * Log level
   */
  logLevel?: LogLevel
}
