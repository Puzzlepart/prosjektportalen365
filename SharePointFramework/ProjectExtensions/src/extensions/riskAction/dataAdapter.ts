import { PlannerTask } from '@microsoft/microsoft-graph-types'
import { FieldCustomizerContext } from '@microsoft/sp-listview-extensibility'
import { GraphFI, SPFx as graphSPFx, graphfi } from '@pnp/graph'
import '@pnp/graph/presets/all'
import { SPFx as spSPFx, spfi } from '@pnp/sp'
import '@pnp/sp/presets/all'
import { IList } from '@pnp/sp/presets/all'
import { DefaultCaching, SPDataAdapterBase } from 'pp365-shared-library'
import {
  RiskActionItemContext,
  RiskActionHiddenFieldValues,
  RiskActionPlannerTaskReference,
  RiskActionPlannerTask,
  RiskActionTasksResult
} from './types'
import { Caching } from '@pnp/queryable'

/**
 * Extracts Graph's refusal reason from PnPjs's serialized error body, falling back to its message.
 */
function plannerErrorMessage(error: any): string {
  const message = String(error?.message ?? error ?? '')
  try {
    const reason = JSON.parse(message.split('::>')[1]).error.message
    if (typeof reason === 'string' && reason.trim() !== '') return reason
  } catch {
    // Not an error body from Graph: the message as it is.
  }
  return message
}

/** Coordinates Planner tasks and the risk list's visible and hidden task fields. */
export class DataAdapter extends SPDataAdapterBase {
  private readonly graph: GraphFI
  private readonly list: IList
  private readonly hiddenDataFieldName = 'RiskActionData'
  private readonly hiddenUpdateFieldName = 'RiskActionUpdated'

  /**
   * The bucket lookups under way, by plan ID, which a call made meanwhile waits for.
   */
  private readonly _bucketLookups = new Map<string, Promise<string>>()

  constructor(private readonly _context: FieldCustomizerContext) {
    super()
    this.graph = graphfi().using(graphSPFx(this._context))
    this.sp = spfi().using(spSPFx(this._context))
    this.list = this.sp.web.lists.getById(this._context.pageContext.list.id.toString())
  }

  /** Resolves a selected person's email to a Graph user ID. */
  private async _getUserId(mail: string): Promise<any> {
    const [user] = await this.graph.users.filter(`mail eq '${mail}'`)()
    return user?.id
  }

  /**
   * Reads an assignee's display name and mail using the shared cache policy.
   */
  private async _getUserInfo(userId: string): Promise<{ displayName: string; mail: string }> {
    return await this.graph.users
      .getById(userId)
      .select('displayName', 'mail')
      .using(DefaultCaching)()
  }

  /** Takes the first Planner plan returned for the site's Microsoft 365 group. */
  private async _getDefaultGroupPlan() {
    const group = this.graph.groups.getById(this._context.pageContext.legacyPageContext.groupId)
    const [plan] = await group.plans()
    return plan
  }

  /**
   * Ensures the configured risk-action bucket, sharing in-flight lookups to prevent duplicates.
   */
  private _ensureBucket(planId: string): Promise<string> {
    let lookup = this._bucketLookups.get(planId)
    if (!lookup) {
      // Forgotten once settled, so a bucket deleted later is added again by the next call.
      lookup = this._findOrAddBucket(planId).finally(() => this._bucketLookups.delete(planId))
      this._bucketLookups.set(planId, lookup)
    }
    return lookup
  }

  /**
   * Finds or creates the bucket named by RiskActionPlannerBucketName and returns its ID.
   */
  private async _findOrAddBucket(planId: string): Promise<string> {
    const bucketName = this.globalSettings.get('RiskActionPlannerBucketName')
    const buckets = await this.graph.planner.plans.getById(planId).buckets()
    const bucket = buckets.find(({ name }) => name === bucketName)
    if (bucket) return bucket.id
    const addedBucket = await this.graph.planner.buckets.add({
      name: bucketName,
      planId,
      orderHint: ' !'
    })
    return addedBucket.id
  }

  /**
   * The plan and the bucket new tasks go to: the group's default plan and the bucket for risk
   * actions in it, added when the plan lacks it.
   */
  private async _getTaskTarget(): Promise<{ planId: string; bucketId: string }> {
    const defaultPlan = await this._getDefaultGroupPlan()
    const bucketId = await this._ensureBucket(defaultPlan.id)
    return { planId: defaultPlan.id, bucketId }
  }

  /**
   * Creates action tasks in parallel after resolving a shared plan and bucket.
   *
   * @returns The tasks added, and the actions whose task Planner refused.
   */
  public async addTasks(
    titles: string[],
    itemContext: RiskActionItemContext
  ): Promise<RiskActionTasksResult> {
    let target: { planId: string; bucketId: string }
    try {
      target = await this._getTaskTarget()
    } catch (error) {
      throw new Error(plannerErrorMessage(error))
    }
    const outcomes = await Promise.all(
      titles.map((title) =>
        this.addTask(new Map([['title', title]]), itemContext, target).then(
          (task) => ({ title, task, reason: undefined as string }),
          (error: Error) => ({ title, task: undefined as PlannerTask, reason: error.message })
        )
      )
    )
    return {
      added: outcomes.filter(({ task }) => task).map(({ task }) => task),
      refused: outcomes.filter(({ task }) => !task).map(({ title, reason }) => ({ title, reason }))
    }
  }

  /**
   * Creates a task with assignments, dates, description and a reference back to the risk.
   *
   * @param target The plan and the bucket to add the task to, when the caller has looked them up
   */
  public async addTask(
    model: Map<string, any>,
    itemContext: RiskActionItemContext,
    target?: { planId: string; bucketId: string }
  ): Promise<PlannerTask> {
    try {
      let assignments = null
      if (model.get('responsible')) {
        const responsible = await this._getUserId(model.get('responsible'))
        assignments = {
          [responsible]: {
            '@odata.type': 'microsoft.graph.plannerAssignment',
            orderHint: ' !'
          }
        }
      }
      const { planId, bucketId } = target ?? (await this._getTaskTarget())
      const createdTask = await this.graph.planner.tasks.add({
        planId,
        title: model.get('title'),
        bucketId
      })
      const task = this.graph.planner.tasks.getById(createdTask.id)
      // PnPjs 4 resolves `add` to the created task payload, which carries the Planner ETag.
      let eTag = createdTask['@odata.etag'] ?? '*'
      const taskUpdate = {
        assignments,
        startDateTime: model.get('startDate') ?? null,
        dueDateTime: model.get('dueDate') ?? null
      }
      Object.keys(taskUpdate).forEach((key) => {
        if (taskUpdate[key] === null) delete taskUpdate[key]
      })
      if (Object.keys(taskUpdate).length > 0) {
        await task.update(taskUpdate, eTag)
      }
      const details = await task.details<any>()
      eTag = details['@odata.etag']
      await task.details.update(
        {
          description: model.get('description') ?? '',
          references: itemContext.references,
          previewType: 'noPreview'
        },
        eTag
      )
      return createdTask
    } catch (error) {
      throw new Error(plannerErrorMessage(error))
    }
  }

  /** Persists current Planner titles and completion states, removes deleted tasks and returns updated context. */
  public async syncTasks(itemContext: RiskActionItemContext): Promise<RiskActionItemContext> {
    const defaultPlan = await this._getDefaultGroupPlan()
    const bucketId = await this._ensureBucket(defaultPlan.id)
    const tasks = await this.graph.planner.tasks
      .top(999)
      .filter(`planId eq '${defaultPlan.id}' and bucketId eq '${bucketId}'`)
      .select('id', 'title', 'percentComplete')()
    const updatedTasks = itemContext.hiddenFieldValues.tasks
      .map<RiskActionPlannerTaskReference>((task) => {
        const updatedTask = tasks.find(({ id }) => id === task.id)
        if (!updatedTask) return null
        return {
          ...task,
          title: updatedTask.title,
          isCompleted: updatedTask.percentComplete === 100 ? '1' : '0'
        }
      })
      .filter(Boolean)
    const listItem = this.list.items.getById(itemContext.id)
    const updatedItemContext = itemContext.update(updatedTasks)
    await listItem.update({
      GtRiskAction: updatedItemContext.fieldValue,
      [this.hiddenDataFieldName]: updatedItemContext.hiddenFieldValues.data,
      [this.hiddenUpdateFieldName]: new Date()
    })
    return updatedItemContext
  }

  /**
   * Reads parsed task-preview details, caching the Graph response in session storage for 60 seconds.
   */
  public async getTask(taskId: string): Promise<any> {
    const task = await this.graph.planner.tasks
      .getById(taskId)
      .expand('details')
      .using(
        Caching({
          expireFunc: () => new Date(Date.now() + 60000),
          keyFactory: () => `risk-action-get-task-${taskId}`,
          store: 'session'
        })
      )()
    return RiskActionPlannerTask.parse(task, this._getUserInfo.bind(this))
  }

  /**
   * Appends new task references to the risk item and returns its updated context.
   *
   * @param keep The text the action field keeps after the tasks' titles: the actions whose task
   * Planner refused at a migration. By default as `RiskActionItemContext.update` keeps it.
   */
  public async updateItem(
    newTasks: PlannerTask[],
    itemContext: RiskActionItemContext,
    keep?: string[]
  ): Promise<RiskActionItemContext> {
    const tasks = [
      ...(itemContext.hiddenFieldValues?.tasks ?? []),
      ...newTasks.map<RiskActionPlannerTaskReference>((newTask) => ({
        id: newTask.id,
        title: newTask.title,
        isCompleted: '0'
      }))
    ]
    const listItem = this.list.items.getById(itemContext.id)
    const updatedItemContext = itemContext.update(tasks, keep)
    await listItem.update({
      GtRiskAction: updatedItemContext.fieldValue,
      [this.hiddenDataFieldName]: updatedItemContext.hiddenFieldValues.data
    })
    return updatedItemContext
  }

  /** Ensures hidden fields for serialized task references and the last synchronization timestamp. */
  public async ensureHiddenFields(): Promise<void> {
    const listFields = this.list.fields
    if (
      (
        await listFields.filter(
          `InternalName eq '${this.hiddenDataFieldName}' or InternalName eq '${this.hiddenUpdateFieldName}'`
        )()
      ).length === 2
    )
      return
    await Promise.all([
      listFields.addMultilineText(this.hiddenDataFieldName, {
        Hidden: true,
        Indexed: false
      }),
      listFields.addDateTime(this.hiddenUpdateFieldName, {
        Hidden: true,
        Indexed: false
      })
    ])
  }

  /**
   * Reads hidden task fields and indexes parsed references by the risk item's string ID.
   */
  public async getHiddenFieldValues(): Promise<Map<string, RiskActionHiddenFieldValues>> {
    try {
      const hiddenFieldValues = await this.list.items.select(
        'Id',
        this.hiddenDataFieldName,
        this.hiddenUpdateFieldName
      )()
      return hiddenFieldValues.reduce((acc, item) => {
        const data = item[this.hiddenDataFieldName] ?? ''
        const tasks = RiskActionPlannerTaskReference.fromString(data)
        acc.set(item.Id.toString(), {
          data,
          tasks,
          updated: item[this.hiddenUpdateFieldName]
        })
        return acc
      }, new Map<string, RiskActionHiddenFieldValues>())
    } catch (e) {
      return new Map<string, RiskActionHiddenFieldValues>()
    }
  }
}
