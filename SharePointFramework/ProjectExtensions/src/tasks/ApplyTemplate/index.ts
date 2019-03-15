import { override } from '@microsoft/decorators';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { WebProvisioner, Web } from 'sp-js-provisioning';
import { ApplyTemplateStatusMap } from './ApplyTemplateStatusMap';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import * as stringFormat from 'string-format';
import { IBaseTaskParams } from '../IBaseTaskParams';
import { BaseTaskError } from '../BaseTaskError';

export default class ApplyTemplate extends BaseTask {
    constructor() {
        super('ApplyTemplate');
    }

    @override
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        try {
            const web = new Web(params.context.pageContext.web.absoluteUrl);
            const provisioner = new WebProvisioner(web);
            provisioner.setup({
                spfxContext: params.context,
                logging: {
                    prefix: '(ProjectSetupApplicationCustomizer) (ApplyTemplate)',
                    activeLogLevel: 1
                },
                parameters: { fieldsgroup: "Prosjektportalenkolonner" },
            });
            let template = await params.data.selectedTemplate.getSchema();
            await provisioner.applyTemplate(template, null, status => {
                if (ApplyTemplateStatusMap[status]) {
                    onProgress(ApplyTemplateStatusMap[status].text, ApplyTemplateStatusMap[status].iconName);
                }
            });
            for (let i = 0; i < params.data.selectedExtensions.length; i++) {
                template = await params.data.selectedExtensions[i].getSchema();
                onProgress(stringFormat(strings.ApplyExtensionText, params.data.selectedExtensions[i].title), 'ExternalBuild');
                await provisioner.applyTemplate(template, null);
            }
            return params;
        } catch (error) {
            console.log(error);
            throw new BaseTaskError('ApplyTemplate', error);
        }
    }
}
