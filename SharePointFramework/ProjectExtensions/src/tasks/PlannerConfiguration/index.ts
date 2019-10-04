import { PageContext } from '@microsoft/sp-page-context';
import { IProjectSetupData } from 'extensions/projectSetup';
import { default as MSGraphHelper } from 'msgraph-helper';
import * as strings from 'ProjectExtensionsStrings';
import * as formatString from 'string-format';
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask';
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction';
import { IPlannerBucket } from './IPlannerBucket';
import { IPlannerConfiguration } from './IPlannerConfiguration';
import { IPlannerPlan } from './IPlannerPlan';
import { TypedHash, getGUID } from '@pnp/common';

export class PlannerConfiguration extends BaseTask {
    public taskName = 'PlannerConfiguration';
    private _config: IPlannerConfiguration;

    constructor(data: IProjectSetupData) {
        super(data);
    }

    /**
     * Create plans
     * 
     * @param {string} owner Owner (group id)
     * @param {OnProgressCallbackFunction} onProgress On progress function
     * @param {string} defaultBucketName Default bucket name
     */
    private async _createPlan(pageContext: PageContext, onProgress: OnProgressCallbackFunction): Promise<IPlannerPlan> {
        let planTitle = pageContext.web.title;
        let owner = pageContext.legacyPageContext.groupId;
        let existingGroupPlans = await this._fetchPlans(owner);
        this.logInformation(`Creating plan ${planTitle}`);
        let { plan, created } = await this._ensurePlan(planTitle, existingGroupPlans, pageContext.legacyPageContext.groupId);
        if (!created) return plan;
        for (let i = 0; i < Object.keys(this._config).length; i++) {
            let bucketName = Object.keys(this._config)[i];
            this.logInformation(`Creating bucket ${bucketName} for plan ${planTitle}`);
            let bucket = await this._createBucket(bucketName, plan.id);
            onProgress(strings.PlannerConfigurationText, formatString(strings.CreatingPlannerTaskText, bucketName), 'PlannerLogo');
            await this._createTasks(plan.id, bucket);
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
            plan = await MSGraphHelper.Post('planner/plans', JSON.stringify({ title, owner }));
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
     * Create tasks for the bucket in the specifiec plan
     * 
     * @param {string} planId Plan Id 
     * @param {IPlannerBucket} bucket Bucket 
     */
    private async _createTasks(planId: string, bucket: IPlannerBucket) {
        const tasks = Object.keys(this._config[bucket.name]);
        for (let i = 0; i < tasks.length; i++) {
            let title = tasks[i];
            let checklist: string[] = this._config[bucket.name][title] || [];
            try {
                this.logInformation(`Creating task ${title} in bucket ${bucket.name}`);
                const task = await MSGraphHelper.Post('planner/tasks', JSON.stringify({ title, bucketId: bucket.id, planId }));
                if (checklist.length > 0) {
                    let taskUpdate: TypedHash<any> = {
                        checklist: checklist.reduce((obj, t) => ({ ...obj, [getGUID()]: { '@odata.type': 'microsoft.graph.plannerChecklistItem', title: t }, }), {}),
                    };
                    let eTag = (await MSGraphHelper.Get(`planner/tasks/${task.id}/details`))['@odata.etag'];
                    await MSGraphHelper.Patch(`planner/tasks/${task.id}/details`, JSON.stringify(taskUpdate), eTag);
                }
                this.logInformation(`Succesfully created task ${title} in bucket ${bucket.name}`, { taskId: task.id, checklist });
            } catch (error) {
                this.logInformation(`Failed to create task ${title} in bucket ${bucket.name}`);
            }
        }
    }

    /**
     * Fetch plans
     * 
     * @param {string} owner Owner (group id) 
     */
    private _fetchPlans(owner: string) {
        return MSGraphHelper.Get<IPlannerPlan[]>(`groups/${owner}/planner/plans`, ['id', 'title']);
    }

    /**
     * Fetch planner config
     * 
     * @param {string} path Config path
     */
    private async _fetchPlannerConfig(path: string = 'Konfigurasjonsfiler/Planneroppgaver.txt'): Promise<IPlannerConfiguration> {
        return await (await fetch(`${this.data.hub.url}/${path}`, { credentials: 'include' })).json();
    }

    /**
     * Execute PlannerConfiguration
     * 
     * @param {IBaseTaskParams} params Task parameters 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        if (this.data.settings.copyPlannerTasks) {
            this.logInformation('Setting up Plans, Buckets and Task');
            try {
                this._config = await this._fetchPlannerConfig();
                let groupPlan = await this._createPlan(params.context.pageContext, onProgress);
                params.templateParameters = { defaultPlanId: groupPlan.id };
            } catch (error) {
                this.logWarning('Failed to set up Plans, Buckets and Tasks', error);
                throw new BaseTaskError(this.taskName, strings.PlannerConfigurationErrorMessage, `${error.statusCode}: ${error.message}`);
            }
        }
        return params;
    }
}