import { LogLevel } from '@pnp/logging'
import { SpEntityPortalService } from 'sp-entityportal-service'
import { SPFxContext } from '../../types'

export interface IProjectDataServiceParams {
  /**
   * Web URL
   */
  webUrl: string

  /**
   * Site ID
   */
  siteId: string

  /**
   * Entity service
   */
  entityService: SpEntityPortalService

  /**
   * List name for project properties
   */
  propertiesListName: string

  /**
   * SPFx context
   */
  spfxContext: SPFxContext

  /**
   * Log level
   */
  logLevel?: LogLevel
}
