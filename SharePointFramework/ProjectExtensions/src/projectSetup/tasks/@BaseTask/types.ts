import { OnProgressCallbackFunction } from '../types'
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import { TypedHash } from '@pnp/common'
import { PortalDataService } from 'pp365-shared-library/lib/services'
import { SpEntityPortalService } from 'sp-entityportal-service'
import { Schema, Web } from 'sp-js-provisioning'
import { ISpfxJsomContext } from 'spfx-jsom'
import { IProjectSetupProperties } from '../../types'
import { ProjectSetupError } from '../../ProjectSetupError'

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

export interface IBaseTask {
  params: IBaseTaskParams
  taskName: string
  execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams>
}

export class BaseTaskError extends ProjectSetupError {
  /**
   * Creates a new instance of BaseTaskError
   *
   * @param taskName Task name
   * @param message Message
   * @param stack Stack
   */
  constructor(taskName: string, message: string, stack: any) {
    super(taskName, message, stack)
  }
}
