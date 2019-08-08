import { override } from '@microsoft/decorators';
import { Logger, LogLevel } from '@pnp/logging';
import { task } from 'decorators/task';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import { Web, WebProvisioner } from 'sp-js-provisioning';
import * as stringFormat from 'string-format';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';
import { ApplyTemplateStatusMap } from './ApplyTemplateStatusMap';

@task('ApplyTemplate')
export default class ApplyTemplate extends BaseTask {
    /**
     * Execute ApplyTemplate
     * 
     * @param {IBaseTaskParams} params Params 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    @override
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        Logger.log({ message: '(ProjectSetupApplicationCustomizer) ApplyTemplate: Applying template to site', data: { parameters: params.templateParameters }, level: LogLevel.Info });
        try {
            const web = new Web(params.context.pageContext.web.absoluteUrl);
            const provisioner = new WebProvisioner(web);
            provisioner.setup({
                spfxContext: params.context,
                logging: { prefix: '(ProjectSetupApplicationCustomizer) (ApplyTemplate)', activeLogLevel: 1 },
                parameters: params.templateParameters,
            });
            await provisioner.applyTemplate(params.templateSchema, null, status => {
                if (ApplyTemplateStatusMap[status]) {
                    onProgress(ApplyTemplateStatusMap[status].text, ApplyTemplateStatusMap[status].iconName);
                }
            });
            for (let i = 0; i < params.data.selectedExtensions.length; i++) {
                let extensionSchema = await params.data.selectedExtensions[i].getSchema();
                onProgress(stringFormat(strings.ApplyExtensionText, params.data.selectedExtensions[i].title), 'ExternalBuild');
                await provisioner.applyTemplate(extensionSchema, null);
            }
            return params;
        } catch (error) {
            Logger.log({ message: '(ProjectSetupApplicationCustomizer) ApplyTemplate: Failed to apply template to site', data: {}, level: LogLevel.Error });
            throw new BaseTaskError(this.name, strings.ApplyTemplateErrorMessage, error);
        }
    }
}
