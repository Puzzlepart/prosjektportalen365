import { override } from '@microsoft/decorators';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { Logger, LogLevel } from '@pnp/logging';
import { WebProvisioner, Web } from 'sp-js-provisioning';
import { ApplyTemplateStatusMap } from './ApplyTemplateStatusMap';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import * as stringFormat from 'string-format';
import { IBaseTaskParams } from '../IBaseTaskParams';
import { BaseTaskError } from '../BaseTaskError';

export default class ApplyTemplate extends BaseTask {
    public static taskName = 'ApplyTemplate';

    constructor() {
        super(ApplyTemplate.taskName);
    }

    @override
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        const parameters: { [key: string]: string } = {
            fieldsgroup: 'Prosjektportalenkolonner',
            defaultPlanId: params.groupPlans[0].id,
        };
        const [noPhasePlan] = params.groupPlans.filter(p => p.title === 'Ingen fase');
        if (noPhasePlan) {
            parameters.noPhasePlanId = noPhasePlan.id;
        }
        Logger.log({ message: '(ProjectSetupApplicationCustomizer) ApplyTemplate: Applying template to site', data: { parameters }, level: LogLevel.Info });
        try {
            const web = new Web(params.context.pageContext.web.absoluteUrl);
            const provisioner = new WebProvisioner(web);
            provisioner.setup({ spfxContext: params.context, logging: { prefix: '(ProjectSetupApplicationCustomizer) (ApplyTemplate)', activeLogLevel: 1 }, parameters });
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
            Logger.log({ message: '(ProjectSetupApplicationCustomizer) ApplyTemplate: Failed to apply template to site', data: {}, level: LogLevel.Error });
            throw new BaseTaskError(ApplyTemplate.taskName, error);
        }
    }
}
