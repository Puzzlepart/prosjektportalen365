import { IProjectSetupData } from '../../extensions/projectSetup/IProjectSetupData';
import * as strings from 'ProjectExtensionsStrings';
import { Web, WebProvisioner } from 'sp-js-provisioning';
import * as formatString from 'string-format';
import * as _ from 'underscore';
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask';
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction';
import { APPLY_TEMPLATE_STATUS_MAP } from './ApplyTemplateStatusMap';

export class ApplyTemplate extends BaseTask {
    public taskName = 'ApplyTemplate';

    constructor(data: IProjectSetupData) {
        super(data);
    }

    /**
     * Execute ApplyTemplate
     * 
     * @param {IBaseTaskParams} params Task parameters 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            const web = new Web(params.context.pageContext.web.absoluteUrl);
            const provisioner = new WebProvisioner(web);
            provisioner.setup({
                spfxContext: params.context,
                logging: { prefix: '(ProjectSetup) (ApplyTemplate)', activeLogLevel: 1 },
                parameters: params.templateParameters,
            });
            this.logInformation('Applying template to site', { parameters: params.templateParameters });
            let templateSchema = _.omit(params.templateSchema, params.templateExcludeHandlers);
            await provisioner.applyTemplate(templateSchema, null, status => {
                if (APPLY_TEMPLATE_STATUS_MAP[status]) {
                    onProgress(formatString(strings.ApplyTemplateText, this.data.selectedTemplate.text), APPLY_TEMPLATE_STATUS_MAP[status].text, APPLY_TEMPLATE_STATUS_MAP[status].iconName);
                }
            });
            this.logInformation('Applying extensions to site', { parameters: params.templateParameters });
            for (let i = 0; i < this.data.selectedExtensions.length; i++) {
                let extensionSchema = await this.data.selectedExtensions[i].getSchema();
                onProgress(strings.ApplyingExtensionsText, formatString(strings.ApplyExtensionText, this.data.selectedExtensions[i].text), 'ExternalBuild');
                await provisioner.applyTemplate(extensionSchema, null);
            }
            return params;
        } catch (error) {
            this.logError('Failed to apply template to site');
            throw new BaseTaskError(this.taskName, strings.ApplyTemplateErrorMessage, error);
        }
    }
}