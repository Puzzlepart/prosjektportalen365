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

    private async ensurePlan(title: string, existingPlans: IPlannerPlan[], owner: string) {
        let [plan] = existingPlans.filter(p => p.title === title);
        if (!plan) {
            plan = await MSGraphHelper.Post(`planner/plans`, JSON.stringify({ title, owner }));
        }
        return plan;
    }

    private async createBucket(name: string, planId: string) {
        return await MSGraphHelper.Post('planner/buckets', JSON.stringify({ name, planId, orderHint: " !" }));
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

    @override
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        Logger.log({ message: '(ProjectSetupApplicationCustomizer) PlannerConfiguration: Setting up Plans, Buckets and Task', level: LogLevel.Info });
        try {
            const plannerTasks = await (await fetch(`${params.data.hub.url}/Konfigurasjonsfiler/Planneroppgaver.txt`, { credentials: 'include' })).json();
            params.groupPlans = [];
            let existingGroupPlans = await this.getPlans(params.context.pageContext.legacyPageContext.groupId);
            const plans = Object.keys(plannerTasks);
            for (let i = 0; i < plans.length; i++) {
                Logger.log({ message: `(ProjectSetupApplicationCustomizer) PlannerConfiguration: Creating plan ${plans[i]}`, level: LogLevel.Info });
                let groupPlan = await this.ensurePlan(plans[i], existingGroupPlans, params.context.pageContext.legacyPageContext.groupId);
                params.groupPlans.push(groupPlan);
                let planBuckets = await this.getPlanBuckets(groupPlan.id);
                let [defaultPlanBucket] = planBuckets;
                if (!defaultPlanBucket) {
                    let defaultPlanBucketName = 'Gjøremål';
                    Logger.log({ message: `(ProjectSetupApplicationCustomizer) PlannerConfiguration: Creating default bucket ${defaultPlanBucketName} for plan ${plans[i]}`, level: LogLevel.Info });
                    defaultPlanBucket = await this.createBucket(defaultPlanBucketName, groupPlan.id);
                }
                onProgress(stringFormat(strings.PlannerConfigurationText, plans[i]), 'PlannerLogo');
                await this.createTasks(plannerTasks[plans[i]], groupPlan.id, defaultPlanBucket.id);
            }
        } catch (error) {
            Logger.log({ message: '(ProjectSetupApplicationCustomizer) PlannerConfiguration: Failed to set up Plans, Buckets and Tasks', level: LogLevel.Warning });
        }
        return params;
    }
}
