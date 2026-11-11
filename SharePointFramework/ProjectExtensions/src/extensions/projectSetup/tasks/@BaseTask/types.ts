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

export interface IBaseTaskParams {
  /**
   * Configured SP instance from `@pnp/sp`
   */
  sp?: SPFI

  /**
   * Web instance
   */
  web: IWeb

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
   * The `Navigation.QuickLaunch` of the applied template, as its schema declares it (before
   * `ApplyTemplate` leaves it out for an extension that declares its own), and of each selected
   * extension. Set by `ApplyTemplate`; after a re-run the setup adds back only the saved nodes
   * these do not declare.
   */
  declaredQuickLaunch?: NavigationNodes[]

  /**
   * Entity service
   */
  entityService?: SpEntityPortalService

  /**
   * Portal data service
   */
  portalDataService?: PortalDataService

  /**
   * Miscellaneous data
   */
  data?: Record<string, any>
}

export interface IBaseTask {
  params: IBaseTaskParams
  taskName: string
  execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams>
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
