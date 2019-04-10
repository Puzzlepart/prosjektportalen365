import { override } from '@microsoft/decorators';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { Logger, LogLevel } from '@pnp/logging';
import { IBaseTaskParams } from '../IBaseTaskParams';
import MSGraphHelper from 'msgraph-helper';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import * as stringFormat from 'string-format';
import { IPlannerPlan } from './IPlannerPlan';
import { IPlannerBucket } from './IPlannerBucket';
import { Schema } from 'sp-js-provisioning';

export default class PlannerConfiguration extends BaseTask {
    public static taskName = 'SetupProjectInformation';

    constructor() {
        super(PlannerConfiguration.taskName);
    }

    /**
     * Create plans
     * 
     * @param {IPlannerPlan} plan PlannerConfig Planner config
     * @param {string} owner Owner (group id)
     * @param {OnProgressCallbackFunction} onProgress On progress function
     * @param {string} defaultBucketName Default bucket name
     */
    private async createPlans(plannerConfig: { [key: string]: string[] }, owner: string, onProgress: OnProgressCallbackFunction, defaultBucketName: string = 'Gjøremål') {
        let existingGroupPlans = await this.getPlans(owner);
        let groupPlans: IPlannerPlan[] = [];
        for (let i = 0; i < Object.keys(plannerConfig).length; i++) {
            let title = Object.keys(plannerConfig)[i];
            Logger.log({ message: `(ProjectSetupApplicationCustomizer) PlannerConfiguration: Creating plan ${title}`, level: LogLevel.Info });
            let groupPlan = await this.ensurePlan(Object.keys(plannerConfig)[i], existingGroupPlans, owner);
            groupPlans.push(groupPlan);
            let planBuckets = await this.getPlanBuckets(groupPlan.id);
            let [defaultPlanBucket] = planBuckets;
            if (!defaultPlanBucket) {
                Logger.log({ message: `(ProjectSetupApplicationCustomizer) PlannerConfiguration: Creating default bucket ${defaultBucketName} for plan ${title}`, level: LogLevel.Info });
                defaultPlanBucket = await this.createBucket(defaultBucketName, groupPlan.id);
            }
            onProgress(stringFormat(strings.PlannerConfigurationText, title), 'PlannerLogo');
            await this.createTasks(plannerConfig[title], groupPlan.id, defaultPlanBucket);
        }
        return groupPlans;
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
     * 
     * @param {string} planId Plan Id 
     */
    private getPlanBuckets(planId: string) {
        return MSGraphHelper.Get<IPlannerBucket[]>(`planner/plans/${planId}/buckets`, ['id', 'name', 'planId']);
    }

    /**
     * Get page name for plan
     * 
     * @param {string} plan Plan
     */
    private getPageName(plan: IPlannerPlan) {
        return `Oppgaver ${plan.title}.aspx`.split(' ').join('-');
    }

    /**
     * Get client side page for plan
     * 
     * @param {IPlannerPlan} plan Plan 
     */
    private getClientSidePage(plan: IPlannerPlan) {
        return {
            Name: this.getPageName(plan),
            Title: `Oppgaver (${plan.title})`,
            PageLayoutType: 'SingleWebPartAppPage',
            CommentsDisabled: true,
            Sections: [
                {
                    Columns: [
                        {
                            Factor: 12,
                            Controls: [
                                {
                                    Id: '39c4c1c2-63fa-41be-8cc2-f6c0b49b253d',
                                    Properties: {
                                        title: `Oppgaver (${plan.title})`,
                                        isFullScreen: true,
                                        plannerViewMode: 'board',
                                        planId: plan.id,
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    }

    /**
     * Get navigation node for plan
     * 
     * @param {IPlannerPlan} plan Plan 
     */
    private getNavigationNode(plan: IPlannerPlan) {
        return {
            Url: `SitePages/${this.getPageName(plan)}`,
            Title: plan.title
        };
    }

    /**
     * Update template parameters
     * 
     * @param {IPlannerPlan[]} groupPlans Group plans
     * @param {Object} templateParameters Template parameters
     */
    private updateTemplateParameters(groupPlans: IPlannerPlan[], templateParameters: { [key: string]: string; }): { [key: string]: string; } {
        return templateParameters = groupPlans.reduce((_templateParameters, _groupPlan, index) => {
            _templateParameters[`planId|${_groupPlan.title}`] = _groupPlan.id;
            if (index === 0) {
                _templateParameters.defaultPlanId = _groupPlan.id;
            }
            return _templateParameters;
        }, templateParameters);
    }

    /**
     * Update template schema
     * 
     * @param {IPlannerPlan[]} groupPlans Group plans
     * @param {Schema} templateSchema 
     * @param {string} quickLaunchParentNodeTitle Quick launch parent node title
     */
    private updateTemplateSchema(groupPlans: IPlannerPlan[], templateSchema: Schema, quickLaunchParentNodeTitle: string = 'Oppgaver'): Schema {
        let navigationParentIndex = -1;
        let [navigationParent] = templateSchema.Navigation.QuickLaunch.filter(node => node.Title === quickLaunchParentNodeTitle && node.Children.length === 0);
        if (navigationParent) {
            navigationParentIndex = templateSchema.Navigation.QuickLaunch.indexOf(navigationParent);
        }
        return groupPlans.reduce((_templateSchema, _groupPlan) => {
            _templateSchema.ClientSidePages.push(this.getClientSidePage(_groupPlan));
            if (navigationParentIndex !== -1) {
                _templateSchema.Navigation.QuickLaunch[navigationParentIndex].Children.push(this.getNavigationNode(_groupPlan));
            }
            return _templateSchema;
        }, templateSchema);
    }

    @override
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        Logger.log({ message: '(ProjectSetupApplicationCustomizer) PlannerConfiguration: Setting up Plans, Buckets and Task', level: LogLevel.Info });
        try {
            const plannerConfig = await (await fetch(`${params.data.hub.url}/Konfigurasjonsfiler/Planneroppgaver.txt`, { credentials: 'include' })).json();
            let groupPlans = await this.createPlans(plannerConfig, params.context.pageContext.legacyPageContext.groupId, onProgress);
            params.templateParameters = this.updateTemplateParameters(groupPlans, params.templateParameters);
            params.templateSchema = this.updateTemplateSchema(groupPlans, params.templateSchema);
        } catch (error) {
            Logger.log({ message: '(ProjectSetupApplicationCustomizer) PlannerConfiguration: Failed to set up Plans, Buckets and Tasks', level: LogLevel.Warning });
        }
        return params;
    }
}
