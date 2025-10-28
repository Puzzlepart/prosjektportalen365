import { PageContext } from '@microsoft/sp-page-context'
import { getGUID } from '@pnp/core'
import { default as MSGraphHelper } from 'msgraph-helper'
import { format } from '@fluentui/react/lib/Utilities'
import { sleep } from 'pp365-shared-library/lib/util'
import * as strings from 'ProjectExtensionsStrings'
import { IProjectSetupData } from 'extensions/projectSetup'
import { BaseTask, BaseTaskError, IBaseTaskParams } from '../@BaseTask'
import { OnProgressCallbackFunction } from '../types'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { SPDataAdapter } from 'data'
import { IPlannerBucket, IPlannerConfiguration, IPlannerPlan, ITaskDetails } from './types'
import _ from 'underscore'
import resource from 'SharedResources'

/**
 * @class PlannerConfiguration
 */
export class PlannerConfiguration extends BaseTask {
  /**
   * Constructor
   *
   * @param planTitle Plan title
   * @param data Project setup data
   * @param _configuration Planner configuration object
   * @param _labels Planner labels
   */
  constructor(
    public planTitle: string,
    data: IProjectSetupData,
    private _configuration: IPlannerConfiguration,
    private _labels: string[] = []
  ) {
    super('Planner', data)
  }

  private _categoryDescriptions: { [key: string]: string } = {}

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
      let plan: IPlannerPlan = {
        title: [this.planTitle, pageContext.web.title].filter(Boolean).join(' - '),
        owner: pageContext.legacyPageContext.groupId
      }
      this.logInformation(`Creating plan ${plan.title}`)
      plan = await this.ensurePlan(plan, pageContext)
      const existingBuckets = await this._fetchBuckets(plan.id)
      for (let i = 0; i < Object.keys(this._configuration).length; i++) {
        const bucketName = Object.keys(this._configuration)[i]
        this.logInformation(`Ensuring bucket ${bucketName} for plan ${plan.title}`)
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
   * @param plan Plan object
   * @param setupLabels Setup labels for the plan
   */
  public async ensurePlan(
    plan: IPlannerPlan,
    pageContext: PageContext,
    setupLabels = true
  ): Promise<IPlannerPlan> {
    try {
      const existingGroupPlans = await this.fetchPlans(plan.owner)
      const existingPlan = _.find(existingGroupPlans, (p) => p.title === plan.title)
      if (!existingPlan) {
        plan = await MSGraphHelper.Post('planner/plans', JSON.stringify(plan))
      }
      if (setupLabels) await this._setupLabels(plan, pageContext)
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
  private async _setupLabels(plan: IPlannerPlan, pageContext: PageContext, delay: number = 5) {
    this.logInformation(`Sleeping ${delay} seconds before updating the plan with labels`)
    await sleep(delay)
    if (this._labels.length > 0) {
      this.logInformation(
        `Sleeping before updating the plan with labels ${JSON.stringify(this._labels)}`
      )
      const eTag = (await MSGraphHelper.Get(`planner/plans/${plan.id}/details`))['@odata.etag']

      if (this._labels.length > 25) {
        ListLogger.init(
          SPDataAdapter.portalDataService.web.lists.getByTitle(resource.Lists_Log_Title),
          pageContext.web.absoluteUrl,
          'PlannerConfiguration'
        )

        await ListLogger.log({
          message: format(strings.PlannerTagsLimitLogText, plan.title ?? plan.id),
          functionName: '_setupLabels',
          level: 'Warning',
          component: 'PlannerConfiguration'
        })
      }

      this._categoryDescriptions = this._labels
        .slice(0, 25)
        .reduce((obj, value, idx) => ({ ...obj, [`category${idx + 1}`]: value }), {})

      await MSGraphHelper.Patch(
        `planner/plans/${plan.id}/details`,
        JSON.stringify({ categoryDescriptions: this._categoryDescriptions }),
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
   * @param pageContext SP page context
   * @param appliedCategories Categories to apply to the task
   * @param delay Delay in seconds before updating the task details to ensure it's created properly
   */
  private async _createTasks(
    planId: string,
    bucket: IPlannerBucket,
    pageContext: PageContext,
    appliedCategories: Record<string, boolean> = {},
    delay: number = 1
  ) {
    const tasks = Object.keys(this._configuration[bucket.name])
    for (let i = 0; i < tasks.length; i++) {
      const name = tasks[i]
      const { checklist } = this._configuration[bucket.name][name]
      const { labels } = this._configuration[bucket.name][name]

      if (labels) {
        Object.keys(this._categoryDescriptions).forEach((key) => {
          if (labels.includes(this._categoryDescriptions[key])) {
            appliedCategories[key] = true
          } else {
            appliedCategories[key] = false
          }
        })
      } else {
        appliedCategories = {}
      }

      try {
        this.logInformation(`Creating task ${name} in bucket ${bucket.name}`)
        const task = await this._createTask({
          title: name,
          bucketId: bucket.id,
          planId,
          appliedCategories
        })
        await this._updateTaskDetails(
          task.id,
          this._configuration[bucket.name][name],
          pageContext,
          delay
        )
        this.logInformation(`Succesfully created task ${name} in bucket ${bucket.name}`, {
          taskId: task.id,
          checklist,
          labels
        })
      } catch (error) {
        this.logWarning(`Failed to create task ${name} in bucket ${bucket.name}`)
      }
    }
  }

  /**
   * Update task details
   *
   * @param taskId Task ID
   * @param taskDetails Task details
   * @param pageContext SP page context
   * @param delay Delay in seconds before updating the task details to ensure it's created properly
   */
  private async _updateTaskDetails(
    taskId: any,
    taskDetails: ITaskDetails,
    pageContext: PageContext,
    delay: number = 1
  ) {
    if (
      !taskDetails.name &&
      !taskDetails.description &&
      !taskDetails.checklist &&
      !taskDetails.labels &&
      !taskDetails.attachments &&
      taskDetails.previewType === 'automatic'
    )
      return

    this.logInformation(`Sleeping ${delay}s before updating task details for ${taskId}`)
    await sleep(delay)

    if (taskDetails.checklist?.length > 20 || taskDetails.attachments?.length > 10) {
      ListLogger.init(
        SPDataAdapter.portalDataService.web.lists.getByTitle(resource.Lists_Log_Title),
        pageContext.web.absoluteUrl,
        'PlannerConfiguration'
      )

      if (taskDetails.checklist?.length > 20) {
        await ListLogger.log({
          message: format(strings.PlannerTaskChecklistLimitLogText, taskDetails.name ?? taskId),
          functionName: '_updateTaskDetails',
          level: 'Warning',
          component: 'PlannerConfiguration'
        })
      }

      if (taskDetails.attachments?.length > 10) {
        await ListLogger.log({
          message: format(strings.PlannerTaskAttachmentLimitLogText, taskDetails.name ?? taskId),
          functionName: '_updateTaskDetails',
          level: 'Warning',
          component: 'PlannerConfiguration'
        })
      }
    }

    const taskDetailsJson: Record<string, any> = {
      description: taskDetails.description ?? '',
      checklist: taskDetails.checklist
        ? taskDetails.checklist
            .slice(0, 20)
            .map((item) => item.substring(0, 100))
            .reduce(
              (obj, title) => ({
                ...obj,
                [getGUID()]: { '@odata.type': 'microsoft.graph.plannerChecklistItem', title }
              }),
              {}
            )
        : {},
      labels: taskDetails.labels,
      references: taskDetails.attachments
        ? taskDetails.attachments.slice(0, 10).reduce(
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
      previewType: taskDetails.previewType
    }

    const eTag = (await MSGraphHelper.Get(`planner/tasks/${taskId}/details`))['@odata.etag']
    await MSGraphHelper.Patch(
      `planner/tasks/${taskId}/details`,
      JSON.stringify(taskDetailsJson),
      eTag
    )
  }

  /**
   * Create task
   *
   * @param task Task JSON
   */
  private async _createTask(task: Record<string, any>) {
    return await MSGraphHelper.Post('planner/tasks', JSON.stringify(task))
  }

  /**
   * Fetch plans
   *
   * @param owner Owner (group id)
   */
  public fetchPlans(owner: string) {
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
