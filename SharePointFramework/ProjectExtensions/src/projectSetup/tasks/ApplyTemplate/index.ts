import { format } from '@fluentui/react/lib/Utilities'
import { LogLevel } from '@pnp/logging'
import * as strings from 'ProjectExtensionsStrings'
import { Web, WebProvisioner } from 'sp-js-provisioning'
import _ from 'underscore'
import { IProjectSetupData } from '../../types'
import { BaseTask, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../types'
import { APPLY_TEMPLATE_STATUS_MAP, ApplyTemplateTaskError } from './types'

export class ApplyTemplate extends BaseTask {
  constructor(data: IProjectSetupData) {
    super('ApplyTemplate', data)
  }

  /**
   * Execute ApplyTemplate
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
      const activeLogLevel = (
        sessionStorage.DEBUG === '1' || DEBUG ? LogLevel.Info : LogLevel.Error
      ) as any
      const provisioner = new WebProvisioner(web).setup({
        spfxContext: params.context,
        logging: {
          prefix: '(ProjectSetup) (ApplyTemplate)',
          activeLogLevel
        },
        spConfiguration: {
          cacheExpirationIntervalMilliseconds: 5000,
          defaultCachingStore: 'session',
          enableCacheExpiration: true,
          defaultCachingTimeoutSeconds: 60
        }
      })
      this.logInformation('Applying template to site', {
        parameters: params.templateParameters
      })
      const templateSchema = _.omit(
        params.templateSchema,
        params.templateExcludeHandlers
      )
      await provisioner.applyTemplate(templateSchema, null, (handler) => {
        if (APPLY_TEMPLATE_STATUS_MAP[handler]) {
          onProgress(
            format(strings.ApplyTemplateText, this.data.selectedTemplate.text),
            APPLY_TEMPLATE_STATUS_MAP[handler].text,
            APPLY_TEMPLATE_STATUS_MAP[handler].iconName
          )
        }
      })
      this.logInformation('Applying extensions to site', {
        parameters: params.templateParameters
      })
      for (let i = 0; i < this.data.selectedExtensions.length; i++) {
        let extensionSchema = await this.data.selectedExtensions[i].getSchema()
        extensionSchema = _.omit(extensionSchema, 'Hooks')
        onProgress(
          strings.ApplyingExtensionsText,
          format(
            strings.ApplyExtensionText,
            this.data.selectedExtensions[i].text
          ),
          'ExternalBuild'
        )
        await provisioner.applyTemplate(extensionSchema, null)
      }
      return params
    } catch (error) {
      throw new ApplyTemplateTaskError(error)
    }
  }
}
