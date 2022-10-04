import { PageContext } from '@microsoft/sp-page-context'
import { getGUID } from '@pnp/common'
import { default as MSGraphHelper } from 'msgraph-helper'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import { sleep } from 'pp365-shared/lib/util'
import * as strings from 'ProjectExtensionsStrings'
import { IProjectSetupData } from 'projectSetup'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../OnProgressCallbackFunction'
import { IPlannerBucket, IPlannerConfiguration, IPlannerPlan } from './types'
/**
 * @class PlannerConfiguration
 */
export class PlannerConfiguration extends BaseTask {
  /**
   * Constructor
   *
   * @param data Project setup data
   * @param _configuration Planner configuration object
   * @param _labels Planner labels
   */
  constructor(
    data: IProjectSetupData,
    private _configuration: IPlannerConfiguration,
    private _labels: string[] = []
  ) {
    super('Planner', data)
  }

  /**
   * Replacing site tokens. For now it supports `{site}` which is replaced
   * with the site absolute URL. Encodes URL, replacing %, . and :
   *
   * @see https://docs.microsoft.com/en-gb/graph/api/resources/plannerexternalreferences?view=graph-rest-1.0
   *
   * @param str - String
   * @param pageContext - Page context
   */
  private replaceUrlTokens(str: string, pageContext: PageContext) {
    const siteAbsoluteUrl = pageContext.site.absoluteUrl
      .split('%')
      .join('%25')
      .split('.')
      .join('%2E')
      .split(':')
      .join('%3A')
    return str.replace('{site}', siteAbsoluteUrl)
  }

  /**
   * Create plans
   *
   * @param pageContext - Page context
   * @param onProgress On progress function
   */
  private async _createPlan(
    pageContext: PageContext,
    onProgress: OnProgressCallbackFunction
  ): Promise<IPlannerPlan> {
    try {
      const planTitle = pageContext.web.title
      const owner = pageContext.legacyPageContext.groupId
      this.logInformation(`Creating plan ${planTitle}`)
      const plan = await this.ensurePlan(planTitle, owner)
      const existingBuckets = await this._fetchBuckets(plan.id)
      for (let i = 0; i < Object.keys(this._configuration).length; i++) {
        const bucketName = Object.keys(this._configuration)[i]
        this.logInformation(`Ensuring bucket ${bucketName} for plan ${planTitle}`)
        const bucket = await this._ensureBucket(bucketName, existingBuckets, plan.id)
        onProgress(
          strings.PlannerConfigurationText,
          format(strings.CreatingPlannerTaskText, bucketName),
          'PlannerLogo'
        )
        await this._createTasks(plan.id, bucket, pageContext)
      }
      return plan
    } catch (error) {
      throw new Error(`_createPlan: ${error.message}`)
    }
  }

  /**
   * Ensure plan
   *
   * @param title Plan title
   * @param owner Owner (group id)
   * @param setupLabels Setup labels for the plan
   */
  public async ensurePlan(title: string, owner: string, setupLabels = true): Promise<IPlannerPlan> {
    try {
      const existingGroupPlans = await this._fetchPlans(owner)
      let [plan] = existingGroupPlans.filter((p) => p.title === title)
      if (!plan) {
        plan = await MSGraphHelper.Post('planner/plans', JSON.stringify({ title, owner }))
      }
      if (setupLabels) await this._setupLabels(plan)
      return plan
    } catch (error) {
      throw error
    }
  }

  /**
   * Sets up labels for the plan
   *
   * @param plan Plan
   * @param delay Delay in seconds before updating the plan to ensure it's created properly
   */
  private async _setupLabels(plan: IPlannerPlan, delay: number = 5) {
    this.logInformation(`Sleeping ${delay} seconds before updating the plan with labels`)
    await sleep(delay)
    if (this._labels.length > 0) {
      this.logInformation(
        `Sleeping before updating the plan with labels ${JSON.stringify(this._labels)}`
      )
      const eTag = (await MSGraphHelper.Get(`planner/plans/${plan.id}/details`))['@odata.etag']
      const categoryDescriptions = this._labels
        .splice(0, 6)
        .reduce((obj, value, idx) => ({ ...obj, [`category${idx + 1}`]: value }), {})
      await MSGraphHelper.Patch(
        `planner/plans/${plan.id}/details`,
        JSON.stringify({ categoryDescriptions }),
        eTag
      )
    }
  }

  /**
   * Ensure bucket
   *
   * @param name Bucket name
   * @param existingBuckets Existing buckets
   * @param planId Plan Id
   */
  private async _ensureBucket(name: string, existingBuckets: IPlannerBucket[], planId: string) {
    try {
      let [bucket] = existingBuckets.filter((p) => p.name === name)
      if (!bucket) {
        bucket = await MSGraphHelper.Post(
          'planner/buckets',
          JSON.stringify({
            name,
            planId,
            orderHint: ' !'
          })
        )
      }
      return bucket
    } catch (error) {
      throw error
    }
  }

  /**
   * Create tasks for the bucket in the specified plan
   *
   * @param planId Plan Id
   * @param bucket Bucket
   * @param appliedCategories Categories to apply to the task
   * @param delay Delay in seconds before updating the plan to ensure it's created properly
   */
  private async _createTasks(
    planId: string,
    bucket: IPlannerBucket,
    pageContext: PageContext,
    appliedCategories: Record<string, boolean> = { category1: true },
    delay: number = 1
  ) {
    const tasks = Object.keys(this._configuration[bucket.name])
    for (let i = 0; i < tasks.length; i++) {
      const name = tasks[i]
      const { description, checklist, attachments } = this._configuration[bucket.name][name]
      try {
        this.logInformation(`Creating task ${name} in bucket ${bucket.name}`)
        const task = await MSGraphHelper.Post(
          'planner/tasks',
          JSON.stringify({
            title: name,
            bucketId: bucket.id,
            planId,
            appliedCategories
          })
        )
        if (checklist || attachments) {
          this.logInformation(`Sleeping ${delay} seconds before updating task details for ${name}`)
          await sleep(delay)
          const taskDetails: Record<string, any> = {
            description: description ?? '',
            checklist: checklist
              ? checklist.reduce(
                (obj, title) => ({
                  ...obj,
                  [getGUID()]: { '@odata.type': 'microsoft.graph.plannerChecklistItem', title }
                }),
                {}
              )
              : {},
            references: attachments
              ? attachments.reduce(
                (obj, attachment) => ({
                  ...obj,
                  [this.replaceUrlTokens(attachment.url, pageContext)]: {
                    '@odata.type': 'microsoft.graph.plannerExternalReference',
                    alias: attachment.alias,
                    type: attachment.type
                  }
                }),
                {}
              )
              : {},
            previewType: attachments ? 'reference' : 'checklist'
          }
          this.logInformation(
            `Updating task details for ${name} in bucket ${bucket.name}`,
            taskDetails
          )
          const eTag = (await MSGraphHelper.Get(`planner/tasks/${task.id}/details`))['@odata.etag']
          await MSGraphHelper.Patch(
            `planner/tasks/${task.id}/details`,
            JSON.stringify(taskDetails),
            eTag
          )
        }
        this.logInformation(`Succesfully created task ${name} in bucket ${bucket.name}`, {
          taskId: task.id,
          checklist
        })
      } catch (error) {
        this.logWarning(`Failed to create task ${name} in bucket ${bucket.name}`)
      }
    }
  }

  /**
   * Fetch plans
   *
   * @param owner Owner (group id)
   */
  private _fetchPlans(owner: string) {
    return MSGraphHelper.Get<IPlannerPlan[]>(`groups/${owner}/planner/plans`, ['id', 'title'])
  }

  /**
   * Fetch buckets
   *
   * @param planId Plan Id
   */
  private _fetchBuckets(planId: string) {
    return MSGraphHelper.Get<IPlannerBucket[]>(`planner/plans/${planId}/buckets`, [
      'id',
      'name',
      'planId'
    ])
  }

  /**
   * Execute PlannerConfiguration
   *
   * @param params Task parameters
   * @param params Task parameters
   * @param onProgress On progress function
   */
  public async execute(
    params: IBaseTaskParams,
    onProgress: OnProgressCallbackFunction
  ): Promise<IBaseTaskParams> {
    this.logInformation('Setting up Plans, Buckets and Task')
    try {
      const groupPlan = await this._createPlan(params.context.pageContext, onProgress)
      params.templateParameters = { defaultPlanId: groupPlan.id }
    } catch (error) {
      this.logWarning('Failed to set up Plans, Buckets and Tasks', error)
      throw new BaseTaskError(
        this.taskName,
        strings.PlannerConfigurationErrorMessage,
        `${error.statusCode}: ${error.message}`
      )
    }
    return params
  }
}

export * from './types'
