import { PageContext } from '@microsoft/sp-page-context';
import { default as MSGraphHelper } from 'msgraph-helper';
import * as strings from 'ProjectExtensionsStrings';
import * as formatString from 'string-format';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { BaseTaskError } from '../BaseTaskError';
import { IBaseTaskParams } from '../IBaseTaskParams';
import { IPlannerBucket } from './IPlannerBucket';
import { IPlannerPlan } from './IPlannerPlan';

export default new class PlannerConfiguration extends BaseTask {
    public taskName = 'PlannerConfiguration';

    /**
     * Create plans
     * 
     * @param {IPlannerPlan} plan PlannerConfig Planner config
     * @param {string} owner Owner (group id)
     * @param {OnProgressCallbackFunction} onProgress On progress function
     * @param {string} defaultBucketName Default bucket name
     */
    private async _createPlan(plannerConfig: { [key: string]: string[] }, pageContext: PageContext, onProgress: OnProgressCallbackFunction): Promise<IPlannerPlan> {
        let planTitle = pageContext.web.title;
        let owner = pageContext.legacyPageContext.groupId;
        let existingGroupPlans = await this._fetchPlans(owner);
        this.logInformation(`Creating plan ${planTitle}`);
        let { plan, created } = await this._ensurePlan(planTitle, existingGroupPlans, pageContext.legacyPageContext.groupId);
        if (!created) return plan;
        for (let i = 0; i < Object.keys(plannerConfig).length; i++) {
            let bucketName = Object.keys(plannerConfig)[i];
            this.logInformation(`Creating bucket ${bucketName} for plan ${planTitle}`);
            let bucket = await this._createBucket(bucketName, plan.id);
            onProgress(strings.PlannerConfigurationText, `Oppretter oppgaver for ${bucketName}`, 'PlannerLogo');
            await this._createTasks(plannerConfig[bucketName], plan.id, bucket);
        }
        return plan;
    }

    /**
     * Ensure plan
     * 
     * @param {string} title Plan title
     * @param {IPlannerPlan[]} existingPlans Existing plans
     * @param {string} owner Owner (group id) 
     */
    private async _ensurePlan(title: string, existingPlans: IPlannerPlan[], owner: string): Promise<{ plan: IPlannerPlan, created: boolean }> {
        let [plan] = existingPlans.filter(p => p.title === title);
        let created = false;
        if (!plan) {
            plan = await MSGraphHelper.Post(`planner/plans`, JSON.stringify({ title, owner }));
            created = true;
        }
        return { plan, created };
    }

    /**
     * Create bucket
     * 
     * @param {string} name Bucket name
     * @param {string} planId Plan Id 
     */
    private async _createBucket(name: string, planId: string) {
        return await MSGraphHelper.Post('planner/buckets', JSON.stringify({ name, planId, orderHint: ' !' }));
    }

    /**
     * Create tasks
     * 
     * @param {string[]} tasks Tasks
     * @param {string} planId Plan Id 
     * @param {IPlannerBucket} bucket Bucket 
     */
    private async _createTasks(tasks: string[], planId: string, bucket: IPlannerBucket) {
        for (let i = 0; i < tasks.length; i++) {
            this.logInformation(`Creating task ${tasks[i]} in bucket ${bucket.name}`);
            await MSGraphHelper.Post('planner/tasks', JSON.stringify({ title: tasks[i], bucketId: bucket.id, planId }));
        }
    }

    /**
     * 
     * @param {string} owner Owner (group id) 
     */
    private _fetchPlans(owner: string) {
        return MSGraphHelper.Get<IPlannerPlan[]>(`groups/${owner}/planner/plans`, ['id', 'title']);
    }

    /**
     * Fetch planner config
     * 
     * @param {string} url Url 
     */
    private async _fetchPlannerConfig(url: string) {
        return await (await fetch(`${url}/Konfigurasjonsfiler/Planneroppgaver.txt`, { credentials: 'include' })).json();
    }

    /**
     * Execute PlannerConfiguration
     * 
     * @param {IBaseTaskParams} params Task parameters 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        if (params.data.copyPlannerTasks) {
            this.logInformation('Setting up Plans, Buckets and Task');
            try {
                const plannerConfig = await this._fetchPlannerConfig(params.data.hub.url);
                let groupPlan = await this._createPlan(plannerConfig, params.context.pageContext, onProgress);
                params.templateParameters = { defaultPlanId: groupPlan.id };
            } catch (error) {
                this.logWarning('Failed to set up Plans, Buckets and Tasks', error);
                throw new BaseTaskError(this.taskName, strings.PlannerConfigurationErrorMessage, `${error.statusCode}: ${error.message}`);
            }
        }
        return params;
    }
};