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

    private async createBucket(name: string, planId: string) {
        return await MSGraphHelper.Post('planner/buckets', JSON.stringify({
            name,
            planId: planId,
            orderHint: " !"
        }));
    }

    @override
    public async execute(params: IBaseTaskParams, _onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        Logger.log({ message: '(ProjectSetupApplicationCustomizer) PlannerConfiguration', level: LogLevel.Info });
        const plannerTasks = await (await fetch(`${params.data.hub.url}/Konfigurasjonsfiler/Planneroppgaver.txt`, { credentials: 'include' })).json();
        let groupPlans = [];
        try {
            groupPlans = await MSGraphHelper.Get<IPlannerPlan[]>(`groups/${params.context.pageContext.legacyPageContext.groupId}/planner/plans`, ['id', 'title']);
        } catch (error) {
            groupPlans = [];
        }
        const plans = Object.keys(plannerTasks);
        for (let i = 0; i < plans.length; i++) {
            let [groupPlan] = groupPlans.filter(p => p.title === plans[i]);
            if (!groupPlan) {
                groupPlan = await MSGraphHelper.Post(`planner/plans`, JSON.stringify({
                    title: plans[i],
                    owner: params.context.pageContext.legacyPageContext.groupId,
                }));
            }
            let planBuckets = await MSGraphHelper.Get<IPlannerBucket[]>(`planner/plans/${groupPlan.id}/buckets`, ['id', 'name', 'planId']);
            let [defaultPlanBucket] = planBuckets;
            if (!defaultPlanBucket) {
                defaultPlanBucket = await this.createBucket('Ikke startet', groupPlan.id);
            }
            await Promise.all([
                this.createBucket('Pågår', groupPlan.id),
                this.createBucket('Utsatt', groupPlan.id),
                this.createBucket('Venter på andre', groupPlan.id),
            ]);
            let planTasks = plannerTasks[plans[i]];
            for (let j = 0; j < planTasks.length; j++) {
                await MSGraphHelper.Post('planner/tasks', JSON.stringify({
                    title: planTasks[j],
                    bucketId: defaultPlanBucket.id,
                    planId: groupPlan.id,
                }));
            }
        }
        return params;
    }
}
