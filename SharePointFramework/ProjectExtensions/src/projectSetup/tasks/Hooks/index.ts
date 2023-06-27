import { LogLevel } from '@pnp/logging'
import * as strings from 'ProjectExtensionsStrings'
import { Web, WebProvisioner } from 'sp-js-provisioning'
import _ from 'underscore'
import { IProjectSetupData } from '../../types'
import { BaseTask, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction'
import { HooksTaskError } from './HooksTaskError'

export class Hooks extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('Hooks', data)
  }

  /**
   * Execute Hooks
   *
   * @param params Task parameters
   * @param onProgress On progress function
   */
  public async execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams> {
    try {
      const web = new Web(params.context.pageContext.web.absoluteUrl)
      const activeLogLevel = (sessionStorage.DEBUG === '1' || DEBUG
        ? LogLevel.Info
        : LogLevel.Error) as any
      const provisioner = new WebProvisioner(web).setup({
        spfxContext: params.context,
        logging: {
          prefix: '(ProjectSetup) (Hooks)',
          activeLogLevel
        },
        spConfiguration: {
          cacheExpirationIntervalMilliseconds: 5000,
          defaultCachingStore: 'session',
          enableCacheExpiration: true,
          defaultCachingTimeoutSeconds: 60
        }
      })
      this.logInformation('Applying template with hooks to site', {
        parameters: params.templateParameters
      })
      const templateHooksSchema = _.pick(params.templateSchema, 'Hooks')
      if (templateHooksSchema.Hooks) {
        onProgress(strings.RunHooksText, strings.ApplyTemplateHooks, 'ProcessingRun')
        await provisioner.applyTemplate(templateHooksSchema, null)
      }

      this.logInformation('Applying extensions with hooks to site', {
        parameters: params.templateParameters
      })
      for (let i = 0; i < this.data.selectedExtensions.length; i++) {
        const extensionSchema = await this.data.selectedExtensions[i].getSchema()
        const extensionHooksSchema = _.pick(extensionSchema, 'Hooks')
        onProgress(strings.RunHooksText, strings.ApplyExtensionHooks, 'ProcessingRun')
        await provisioner.applyTemplate(extensionHooksSchema, null)
      }
      return params
    } catch (error) {
      throw new HooksTaskError(error)
    }
  }
}
