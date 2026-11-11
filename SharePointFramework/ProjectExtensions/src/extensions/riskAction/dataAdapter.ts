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
 * What Planner said when it refused a request: the `message` of the error body (`{ "error": {
 * "code", "message" } }`) that PnPjs puts after `::>` in the message of its error, else the
 * error's message.
 *
 * @param error What the request failed with
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

  /**
   * Gets the ID of the user with the provided `mail`.
   *
   * @param mail Mail of the user to get the ID for
   */
  private async _getUserId(mail: string): Promise<any> {
    const [user] = await this.graph.users.filter(`mail eq '${mail}'`)()
    return user?.id
  }

  /**
   * Retrieves `displayName` and `mail` for the user with the provided `userId`. The result
   * is cached for 60 minutes in the local storage.
   *
   * @param userId The ID of the user.
   *
   * @returns A Promise that resolves to the user information.
   */
  private async _getUserInfo(userId: string): Promise<{ displayName: string; mail: string }> {
    return await this.graph.users
      .getById(userId)
      .select('displayName', 'mail')
      .using(DefaultCaching)()
  }

  /**
   * Gets the default plan for the current group.
   *
   * @returns A Promise that resolves to the default plan for the current group.
   */
  private async _getDefaultGroupPlan() {
    const group = this.graph.groups.getById(this._context.pageContext.legacyPageContext.groupId)
    const [plan] = await group.plans()
    return plan
  }

  /**
   * Ensures that the bucket named in the global setting `RiskActionPlannerBucketName` exists in the
   * plan, and returns its ID. A call made while a lookup for the plan is under way waits for that
   * lookup rather than adding the bucket a second time.
   *
   * @param planId The ID of the plan to add the bucket to.
   *
   * @returns The ID of the bucket.
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
   * Finds the bucket named in the global setting `RiskActionPlannerBucketName` in the plan, or adds
   * it when the plan has none by that name, and returns its ID.
   *
   * @param planId The ID of the plan
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
   * Adds a task for each of the actions in `titles`. The plan and the bucket are looked up once,
   * before the tasks are added in parallel: each add ensuring the bucket itself gave the actions of
   * a risk, migrated together, a bucket each. A task Planner refuses does not stop the others: the
   * result names its action with Planner's reason.
   *
   * @param titles The titles of the tasks to add, one per action.
   * @param itemContext The Risk Action item context to add the tasks to.
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
   * Adds a task to the current group's plan, and fails with what Planner said when Planner refuses
   * it.
   *
   * @param model Model for the task (Map<string, any>)
   * @param itemContext Item context for the current risk action item
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

  /**
   * Synchronizes the tasks associated with a risk action item with the corresponding tasks in Planner.
   *
   * @param itemContext - The item context for the current risk action item.
   *
   * @returns A Promise that resolves when the synchronization is complete.
   */
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
   * Retrieves a task by its ID cached for 60 seconds in session storage
   * with key `risk-action-get-task-${taskId}`.
   *
   * @param taskId The ID of the task to retrieve.
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
   * Update the current item with the new task's ID and title.
   *
   * @param newTasks The new tasks to add to the current item
   * @param itemContext The item context for the current risk action item
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

  /**
   * Ensures the hidden fields exists on the current list.
   */
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
   * Gets the hidden field values for the current list as a Map in the format
   * `Map<string, RiskActionHiddenFieldValues>` where the key is the ID of the list item
   * and the value is the hidden field values for that item.
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
