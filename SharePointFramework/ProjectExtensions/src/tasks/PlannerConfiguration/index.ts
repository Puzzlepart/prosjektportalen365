import { PageContext } from '@microsoft/sp-page-context'
import { IProjectSetupData } from 'extensions/projectSetup'
import { default as MSGraphHelper } from 'msgraph-helper'
import * as strings from 'ProjectExtensionsStrings'
import * as formatString from 'string-format'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction'
import { IPlannerBucket } from './IPlannerBucket'
import { IPlannerConfiguration } from './IPlannerConfiguration'
import { IPlannerPlan } from './IPlannerPlan'
import { TypedHash, getGUID } from '@pnp/common'

/**
 * @class PlannerConfiguration
 */
export class PlannerConfiguration extends BaseTask {
    public taskName = 'PlannerConfiguration';

    /**
     * Constructor
     * 
     * @param {IProjectSetupData} data Project setup data 
     * @param {IPlannerConfiguration} _configuration Planner configuration object
     * @param {string[]} _labels Planner labels
     */
    constructor(
        data: IProjectSetupData,
        private _configuration: IPlannerConfiguration,
        private _labels: string[] = [],
    ) {
        super(data)
    }

    /**
     * Create plans
     * 
     * @param {string} owner Owner (group id)
     * @param {OnProgressCallbackFunction} onProgress On progress function
     * @param {string} defaultBucketName Default bucket name
     */
    private async _createPlan(pageContext: PageContext, onProgress: OnProgressCallbackFunction): Promise<IPlannerPlan> {
        const planTitle = pageContext.web.title
        const owner = pageContext.legacyPageContext.groupId
        const existingGroupPlans = await this._fetchPlans(owner)
        this.logInformation(`Creating plan ${planTitle}`)
        const plan = await this._ensurePlan(planTitle, existingGroupPlans, pageContext.legacyPageContext.groupId)
        const existingBuckets = await this._fetchBuckets(plan.id)
        for (let i = 0; i < Object.keys(this._configuration).length; i++) {
            const bucketName = Object.keys(this._configuration)[i]
            this.logInformation(`Ensuring bucket ${bucketName} for plan ${planTitle}`)
            const bucket = await this._ensureBucket(bucketName, existingBuckets, plan.id)
            onProgress(strings.PlannerConfigurationText, formatString(strings.CreatingPlannerTaskText, bucketName), 'PlannerLogo')
            await this._createTasks(plan.id, bucket)
        }
        return plan
    }

    /**
     * Ensure plan
     * 
     * @param {string} title Plan title
     * @param {IPlannerPlan[]} existingPlans Existing plans
     * @param {string} owner Owner (group id) 
     */
    private async _ensurePlan(title: string, existingPlans: IPlannerPlan[], owner: string): Promise<IPlannerPlan> {
        let [plan] = existingPlans.filter(p => p.title === title)
        if (!plan) {
            plan = await MSGraphHelper.Post('planner/plans', JSON.stringify({ title, owner }))
        }
        if (this._labels.length > 0) {
            const eTag = (await MSGraphHelper.Get(`planner/plans/${plan.id}/details`))['@odata.etag']
            const categoryDescriptions = this._labels.splice(0, 6).reduce((obj, value, idx) => ({ ...obj, [`category${idx + 1}`]: value }), {})
            await MSGraphHelper.Patch(`planner/plans/${plan.id}/details`, JSON.stringify({ categoryDescriptions }), eTag)
        }
        return plan
    }

    /**
     * Ensure bucket
     * 
     * @param {string} name Bucket name
     * @param {IPlannerBucket[]} existingBuckets Existing buckets
     * @param {string} planId Plan Id 
     */
    private async _ensureBucket(name: string, existingBuckets: IPlannerBucket[], planId: string) {
        let [bucket] = existingBuckets.filter(p => p.name === name)
        if (!bucket) {
            bucket = await MSGraphHelper.Post('planner/buckets', JSON.stringify({ name, planId, orderHint: ' !' }))
        }
        return bucket
    }

    /**
     * Create tasks for the bucket in the specified plan
     * 
     * @param {string} planId Plan Id 
     * @param {IPlannerBucket} bucket Bucket 
     */
    private async _createTasks(planId: string, bucket: IPlannerBucket) {
        const tasks = Object.keys(this._configuration[bucket.name])
        for (let i = 0; i < tasks.length; i++) {
            const name = tasks[i]
            const { checklist, attachments } = this._configuration[bucket.name][name]
            try {
                this.logInformation(`Creating task ${name} in bucket ${bucket.name}`)
                const task = await MSGraphHelper.Post('planner/tasks', JSON.stringify({
                    title: name,
                    bucketId: bucket.id,
                    planId,
                    appliedCategories: { category1: true },
                }))
                if (checklist || attachments) {
                    const taskDetails: TypedHash<any> = {
                        checklist: checklist
                            ? checklist.reduce((obj, title) => ({
                                ...obj,
                                [getGUID()]: { '@odata.type': 'microsoft.graph.plannerChecklistItem', title },
                            }), {})
                            : {},
                        references: attachments
                            ? attachments.reduce((obj, attachment) => ({
                                ...obj,
                                [attachment.url]: {
                                    '@odata.type': 'microsoft.graph.plannerExternalReference',
                                    alias: attachment.alias,
                                    type: attachment.type,
                                },
                            }), {})
                            : {},
                        previewType: attachments ? 'reference' : 'checklist'
                    }
                    this.logInformation(`Updating task details for ${name} in bucket ${bucket.name}`, taskDetails)
                    const eTag = (await MSGraphHelper.Get(`planner/tasks/${task.id}/details`))['@odata.etag']
                    await MSGraphHelper.Patch(`planner/tasks/${task.id}/details`, JSON.stringify(taskDetails), eTag)
                }
                this.logInformation(`Succesfully created task ${name} in bucket ${bucket.name}`, { taskId: task.id, checklist })
            } catch (error) {
                this.logInformation(`Failed to create task ${name} in bucket ${bucket.name}`)
            }
        }
    }

    /**
     * Fetch plans
     * 
     * @param {string} owner Owner (group id) 
     */
    private _fetchPlans(owner: string) {
        return MSGraphHelper.Get<IPlannerPlan[]>(`groups/${owner}/planner/plans`, ['id', 'title'])
    }

    /**
     * Fetch buckets
     * 
     * @param {string} planId Plan Id 
     */
    private _fetchBuckets(planId: string) {
        return MSGraphHelper.Get<IPlannerBucket[]>(`planner/plans/${planId}/buckets`, ['id', 'name', 'planId'])
    }

    /**
     * Execute PlannerConfiguration
     * 
     * @param {IBaseTaskParams} params Task parameters 
     * @param {IBaseTaskParams} params Task parameters 
     * @param {OnProgressCallbackFunction} onProgress On progress function
     */
    public async execute(params: IBaseTaskParams, onProgress: OnProgressCallbackFunction): Promise<IBaseTaskParams> {
        this.logInformation('Setting up Plans, Buckets and Task')
        try {
            const groupPlan = await this._createPlan(params.context.pageContext, onProgress)
            params.templateParameters = { defaultPlanId: groupPlan.id }
        } catch (error) {
            this.logWarning('Failed to set up Plans, Buckets and Tasks', error)
            throw new BaseTaskError(this.taskName, strings.PlannerConfigurationErrorMessage, `${error.statusCode}: ${error.message}`)
        }
        return params
    }
}