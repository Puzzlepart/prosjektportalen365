import { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import { TypedHash } from '@pnp/common'
import { PortalDataService } from 'pp365-shared/lib/services'
import { SpEntityPortalService } from 'sp-entityportal-service'
import { Schema, Web } from 'sp-js-provisioning'
import { ISpfxJsomContext } from 'spfx-jsom'
import { IProjectSetupProperties } from '../../extensions/projectSetup/types'

export interface IBaseTaskParams {
  /**
   * Web
   */
  web: Web

  /**
   * Web absolute URL
   */
  webAbsoluteUrl: string

  /**
   * Template parameters
   */
  templateParameters?: { [key: string]: string }

  /**
   * Template exclude handlers
   */
  templateExcludeHandlers: string[]

  /**
   * Context for the Application Customizer
   */
  context: ApplicationCustomizerContext

  /**
   * Properties
   */
  properties: IProjectSetupProperties

  /**
   * SPFx JSOM context
   */
  spfxJsomContext?: ISpfxJsomContext

  /**
   * Template schema
   */
  templateSchema?: Schema

  /**
   * Entity service
   */
  entityService?: SpEntityPortalService

  /**
   * Portal data service
   */
  portal?: PortalDataService

  /**
   * Miscellaneous data
   */
  data?: TypedHash<any>
}
