import { override } from '@microsoft/decorators';
import { BaseTask, OnProgressCallbackFunction } from '../BaseTask';
import { Logger, LogLevel } from '@pnp/logging';
import { IBaseTaskParams } from '../IBaseTaskParams';
import MSGraphHelper from 'msgraph-helper';

export interface IPlannerPlan {
    id: string;
    title: string;
}

export interface IPlannerBucket {
    id: string;
    name: string;
    planId: string;
}

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
            await MSGraphHelper.Post('planner/tasks', JSON.stringify({ title: tasks[i], bucketId, planId }));
        }
    }

    @override
    public async execute(params: IBaseTaskParams, _onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        Logger.log({ message: '(ProjectSetupApplicationCustomizer) PlannerConfiguration: Setting up Plans, Buckets and Task', level: LogLevel.Info });
        try {
            const plannerTasks = await (await fetch(`${params.data.hub.url}/Konfigurasjonsfiler/Planneroppgaver.txt`, { credentials: 'include' })).json();
            let existingGroupPlans = [];
            try {
                existingGroupPlans = await MSGraphHelper.Get<IPlannerPlan[]>(`groups/${params.context.pageContext.legacyPageContext.groupId}/planner/plans`, ['id', 'title']);
            } catch (error) {
                existingGroupPlans = [];
            }
            const plans = Object.keys(plannerTasks);
            for (let i = 0; i < plans.length; i++) {
                let groupPlan = await this.ensurePlan(plans[i], existingGroupPlans, params.context.pageContext.legacyPageContext.groupId);
                let planBuckets = await MSGraphHelper.Get<IPlannerBucket[]>(`planner/plans/${groupPlan.id}/buckets`, ['id', 'name', 'planId']);
                let [defaultPlanBucket] = planBuckets;
                if (!defaultPlanBucket) {
                    defaultPlanBucket = await this.createBucket('Ikke startet', groupPlan.id);
                }
                try {
                    await Promise.all([
                        this.createBucket('Pågår', groupPlan.id),
                        this.createBucket('Utsatt', groupPlan.id),
                        this.createBucket('Venter på andre', groupPlan.id),
                    ]);
                } catch (error) { }
                await this.createTasks(plannerTasks[plans[i]], groupPlan.id, defaultPlanBucket.id);
            }
        } catch (error) {
            Logger.log({ message: '(ProjectSetupApplicationCustomizer) PlannerConfiguration: Failed to set up Plans, Buckets and Tasks', level: LogLevel.Warning });
        }
        return params;
    }
}
