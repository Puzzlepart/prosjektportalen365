import { override } from '@microsoft/decorators';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { Logger, LogLevel } from '@pnp/logging';
import { IBaseTaskParams } from '../IBaseTaskParams';
import MSGraphHelper from 'msgraph-helper';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import * as stringFormat from 'string-format';
import { IPlannerPlan } from './IPlannerPlan';
import { IPlannerBucket } from './IPlannerBucket';

export default class PlannerConfiguration extends BaseTask {
    public static taskName = 'SetupProjectInformation';

    constructor() {
        super(PlannerConfiguration.taskName);
    }

    private async createPlans(plannerConfig: { [key: string]: string[] }, owner: string, onProgress: OnProgressCallbackFunction) {
        let existingGroupPlans = await this.getPlans(owner);
        let groupPlans = [];
        for (let i = 0; i < Object.keys(plannerConfig).length; i++) {
            let title = Object.keys(plannerConfig)[i];
            Logger.log({ message: `(ProjectSetupApplicationCustomizer) PlannerConfiguration: Creating plan ${title}`, level: LogLevel.Info });
            let groupPlan = await this.ensurePlan(Object.keys(plannerConfig)[i], existingGroupPlans, owner);
            groupPlans.push(groupPlan);
            let planBuckets = await this.getPlanBuckets(groupPlan.id);
            let [defaultPlanBucket] = planBuckets;
            if (!defaultPlanBucket) {
                let defaultPlanBucketName = 'Gjøremål';
                Logger.log({ message: `(ProjectSetupApplicationCustomizer) PlannerConfiguration: Creating default bucket ${defaultPlanBucketName} for plan ${title}`, level: LogLevel.Info });
                defaultPlanBucket = await this.createBucket(defaultPlanBucketName, groupPlan.id);
            }
            onProgress(stringFormat(strings.PlannerConfigurationText, title), 'PlannerLogo');
            await this.createTasks(plannerConfig[title], groupPlan.id, defaultPlanBucket.id);
        }
        return groupPlans;
    }

    private async ensurePlan(title: string, existingPlans: IPlannerPlan[], owner: string) {
        let [plan] = existingPlans.filter(p => p.title === title);
        if (!plan) {
            plan = await MSGraphHelper.Post(`planner/plans`, JSON.stringify({ title, owner }));
        }
        return plan;
    }

    private async createBucket(name: string, planId: string) {
        return await MSGraphHelper.Post('planner/buckets', JSON.stringify({ name, planId, orderHint: ' !' }));
    }

    private async createTasks(tasks: string[], planId: string, bucketId: string) {
        for (let i = 0; i < tasks.length; i++) {
            Logger.log({ message: `(ProjectSetupApplicationCustomizer) PlannerConfiguration: Creating task ${tasks[i]} in bucket ${bucketId}`, level: LogLevel.Info });
            await MSGraphHelper.Post('planner/tasks', JSON.stringify({ title: tasks[i], bucketId, planId }));
        }
    }

    private getPlans(owner: string) {
        return MSGraphHelper.Get<IPlannerPlan[]>(`groups/${owner}/planner/plans`, ['id', 'title']);
    }

    private getPlanBuckets(planId: string) {
        return MSGraphHelper.Get<IPlannerBucket[]>(`planner/plans/${planId}/buckets`, ['id', 'name', 'planId']);
    }

    private getClientSidePage(plan: IPlannerPlan) {
        return {
            Name: `Oppgaver ${plan.title}.aspx`,
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

    private getNavigationNode(plan: IPlannerPlan) {
        return {
            Url: `SitePages/Oppgaver ${plan.title}.aspx`,
            Title: plan.title
        };
    }

    @override
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        Logger.log({ message: '(ProjectSetupApplicationCustomizer) PlannerConfiguration: Setting up Plans, Buckets and Task', level: LogLevel.Info });
        try {
            const plannerConfig = await (await fetch(`${params.data.hub.url}/Konfigurasjonsfiler/Planneroppgaver.txt`, { credentials: 'include' })).json();
            let groupPlans = await this.createPlans(plannerConfig, params.context.pageContext.legacyPageContext.groupId, onProgress);
            let navigationParentIndex = -1;
            let [navigationParent] = params.templateSchema.Navigation.QuickLaunch.filter(node => node.Title === 'Oppgaver' && node.Children.length === 0);
            if (navigationParent) {
                navigationParentIndex = params.templateSchema.Navigation.QuickLaunch.indexOf(navigationParent);
            }
            params.templateParameters = groupPlans.reduce((_templateParameters, _groupPlan, index) => {
                params.templateParameters[`planId|${_groupPlan.title}`] = _groupPlan.id;
                if (index === 0) {
                    params.templateParameters.defaultPlanId = _groupPlan.id;
                }
                params.templateSchema.ClientSidePages.push(this.getClientSidePage(_groupPlan));
                if (navigationParentIndex !== -1) {
                    params.templateSchema.Navigation.QuickLaunch[navigationParentIndex].Children.push(this.getNavigationNode(_groupPlan));
                }
            }, params.templateParameters);
        } catch (error) {
            Logger.log({ message: '(ProjectSetupApplicationCustomizer) PlannerConfiguration: Failed to set up Plans, Buckets and Tasks', level: LogLevel.Warning });
        }
        return params;
    }
}
