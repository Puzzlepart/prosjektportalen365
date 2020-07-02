import { LogLevel } from '@pnp/logging'
import * as strings from 'ProjectExtensionsStrings'
import { Web, WebProvisioner } from 'sp-js-provisioning'
import * as formatString from 'string-format'
import * as _ from 'underscore'
import { IProjectSetupData } from '../../extensions/projectSetup/IProjectSetupData'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction'
import { APPLY_TEMPLATE_STATUS_MAP } from './ApplyTemplateStatusMap'

export class ApplyTemplate extends BaseTask {
    public taskName = 'ApplyTemplate';

    constructor(data: IProjectSetupData) {
        super(data)
    }

    /**
     * Execute ApplyTemplate
     * 
     * @param {IBaseTaskParams} params Task parameters 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            const web = new Web(params.context.pageContext.web.absoluteUrl)
            const provisioner = new WebProvisioner(web).setup({
                spfxContext: params.context,
                logging: {
                    prefix: '(ProjectSetup) (ApplyTemplate)',
                    activeLogLevel: ((sessionStorage.DEBUG === '1' || DEBUG) ? LogLevel.Info : LogLevel.Error),
                },
                parameters: params.templateParameters,
                spConfiguration: {
                    cacheExpirationIntervalMilliseconds: 5000,
                    defaultCachingStore: 'session',
                    enableCacheExpiration: true,
                    defaultCachingTimeoutSeconds: 60,
                }
            })
            this.logInformation('Applying template to site', { parameters: params.templateParameters })
            const templateSchema = _.omit(params.templateSchema, params.templateExcludeHandlers)
            await provisioner.applyTemplate(templateSchema, null, status => {
                if (APPLY_TEMPLATE_STATUS_MAP[status]) {
                    onProgress(formatString(strings.ApplyTemplateText, this.data.selectedTemplate.text), APPLY_TEMPLATE_STATUS_MAP[status].text, APPLY_TEMPLATE_STATUS_MAP[status].iconName)
                }
            })
            this.logInformation('Applying extensions to site', { parameters: params.templateParameters })
            for (let i = 0; i < this.data.selectedExtensions.length; i++) {
                const extensionSchema = await this.data.selectedExtensions[i].getSchema()
                onProgress(strings.ApplyingExtensionsText, formatString(strings.ApplyExtensionText, this.data.selectedExtensions[i].text), 'ExternalBuild')
                await provisioner.applyTemplate(extensionSchema, null)
            }
            return params
        } catch (error) {
            this.logError('Failed to apply template to site')
            throw new BaseTaskError(this.taskName, strings.ApplyTemplateErrorMessage, error)
        }
    }
}