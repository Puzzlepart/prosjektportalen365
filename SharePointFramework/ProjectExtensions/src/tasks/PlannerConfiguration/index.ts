import { override } from '@microsoft/decorators';
import { Logger, LogLevel } from '@pnp/logging';
import { task } from 'decorators/task';
import MSGraphHelper from 'msgraph-helper';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import { Schema } from 'sp-js-provisioning';
import * as stringFormat from 'string-format';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';
import { IPlannerBucket } from './IPlannerBucket';
import { IPlannerPlan } from './IPlannerPlan';
import { PageContext } from '@microsoft/sp-page-context';

@task('PlannerConfiguration')
export default class PlannerConfiguration extends BaseTask {
    /**
     * Create plans
     * 
     * @param {IPlannerPlan} plan PlannerConfig Planner config
     * @param {string} owner Owner (group id)
     * @param {OnProgressCallbackFunction} onProgress On progress function
     * @param {string} defaultBucketName Default bucket name
     */
    private async createPlan(plannerConfig: { [key: string]: string[] }, pageContext: PageContext, onProgress: OnProgressCallbackFunction): Promise<IPlannerPlan> {
        let planTitle = pageContext.web.title;
        let owner = pageContext.legacyPageContext.groupId;
        let existingGroupPlans = await this.getPlans(owner);
        Logger.log({ message: `(ProjectSetupApplicationCustomizer) PlannerConfiguration: Creating plan ${planTitle}`, level: LogLevel.Info });
        let groupPlan = await this.ensurePlan(planTitle, existingGroupPlans, pageContext.legacyPageContext.groupId);
        for (let i = 0; i < Object.keys(plannerConfig).length; i++) {
            let bucketName = Object.keys(plannerConfig)[i];
            Logger.log({ message: `(ProjectSetupApplicationCustomizer) PlannerConfiguration: Creating bucket ${bucketName} for plan ${planTitle}`, level: LogLevel.Info });
            let bucket = await this.createBucket(bucketName, groupPlan.id);
            onProgress(stringFormat(strings.PlannerConfigurationText, bucketName), 'PlannerLogo');
            await this.createTasks(plannerConfig[bucketName], groupPlan.id, bucket);
        }
        return groupPlan;
    }

    /**
     * Ensure plan
     * 
     * @param {string} title Plan title
     * @param {IPlannerPlan[]} existingPlans Existing plans
     * @param {string} owner Owner (group id) 
     */
    private async ensurePlan(title: string, existingPlans: IPlannerPlan[], owner: string) {
        let [plan] = existingPlans.filter(p => p.title === title);
        if (!plan) {
            plan = await MSGraphHelper.Post(`planner/plans`, JSON.stringify({ title, owner }));
        }
        return plan;
    }

    /**
     * Create bucket
     * 
     * @param {string} name Bucket name
     * @param {string} planId Plan Id 
     */
    private async createBucket(name: string, planId: string) {
        return await MSGraphHelper.Post('planner/buckets', JSON.stringify({ name, planId, orderHint: ' !' }));
    }

    /**
     * Create tasks
     * 
     * @param {string[]} tasks Tasks
     * @param {string} planId Plan Id 
     * @param {IPlannerBucket} bucket Bucket 
     */
    private async createTasks(tasks: string[], planId: string, bucket: IPlannerBucket) {
        for (let i = 0; i < tasks.length; i++) {
            Logger.log({ message: `(ProjectSetupApplicationCustomizer) PlannerConfiguration: Creating task ${tasks[i]} in bucket ${bucket.name}`, level: LogLevel.Info });
            await MSGraphHelper.Post('planner/tasks', JSON.stringify({ title: tasks[i], bucketId: bucket.id, planId }));
        }
    }

    /**
     * 
     * @param {string} owner Owner (group id) 
     */
    private getPlans(owner: string) {
        return MSGraphHelper.Get<IPlannerPlan[]>(`groups/${owner}/planner/plans`, ['id', 'title']);
    }

    /**
     * Fetch planner config
     * 
     * @param {string} url Url 
     */
    private async fetchPlannerConfig(url: string) {
        return await (await fetch(`${url}/Konfigurasjonsfiler/Planneroppgaver.txt`, { credentials: 'include' })).json();
    }

    /**
     * Execute PlannerConfiguration
     * 
     * @param {IBaseTaskParams} params Params 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    @override
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        if (params.data.copyPlannerTasks) {
            Logger.log({ message: '(ProjectSetupApplicationCustomizer) PlannerConfiguration: Setting up Plans, Buckets and Task', level: LogLevel.Info });
            try {
                const plannerConfig = await this.fetchPlannerConfig(params.data.hub.url);
                let groupPlan = await this.createPlan(plannerConfig, params.context.pageContext, onProgress);
                params.templateParameters = { ...params.templateParameters || {}, defaultPlanId: groupPlan.id };
            } catch (error) {
                Logger.log({ message: '(ProjectSetupApplicationCustomizer) PlannerConfiguration: Failed to set up Plans, Buckets and Tasks', data: error, level: LogLevel.Warning });
                throw new BaseTaskError(this.name, strings.PlannerConfigurationErrorMessage, `${error.statusCode}: ${error.message}`);
            }
        }
        return params;
    }
}
