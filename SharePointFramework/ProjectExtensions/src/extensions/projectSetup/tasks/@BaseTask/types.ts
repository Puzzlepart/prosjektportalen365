import { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import { SPFI } from '@pnp/sp'
import { IWeb } from '@pnp/sp/webs'
import { SpEntityPortalService } from 'pp365-shared-library'
import { PortalDataService } from 'pp365-shared-library/lib/services'
import { Schema } from 'sp-js-provisioning'
import { ISpfxJsomContext } from 'spfx-jsom'
import { ProjectSetupError } from '../../ProjectSetupError'
import { IProjectSetupProperties } from '../../types'
import { OnProgressCallbackFunction } from '../types'

/**
 * A menu of a schema's `Navigation` (`QuickLaunch` or `TopNavigationBar`), as sp-js-provisioning
 * declares it: nodes with `Title`, `Url` and `Children`.
 */
export type NavigationNodes = NonNullable<NonNullable<Schema['Navigation']>['QuickLaunch']>

/** Provisioning context enriched and passed between sequential setup tasks. */
export interface IBaseTaskParams {
  sp?: SPFI

  web: IWeb

  webAbsoluteUrl: string

  templateParameters?: { [key: string]: string }

  templateExcludeHandlers: string[]

  context: ApplicationCustomizerContext

  properties: IProjectSetupProperties

  spfxJsomContext?: ISpfxJsomContext

  templateSchema?: Schema

  /**
   * Original template and extension menus used to distinguish owner-added links on restoration.
   */
  declaredQuickLaunch?: NavigationNodes[]

  entityService?: SpEntityPortalService

  portalDataService?: PortalDataService

  data?: Record<string, any>
}

/** Contract for a named task in the project-setup pipeline. */
export interface IBaseTask {
  params: IBaseTaskParams
  taskName: string
  execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams>
}

/** Setup error attributed to a provisioning task. */
export class BaseTaskError extends ProjectSetupError {
  constructor(taskName: string, message: string, stack: any) {
    super(taskName, message, stack)
  }
}
