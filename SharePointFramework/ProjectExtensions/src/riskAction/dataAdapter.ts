/* eslint-disable @typescript-eslint/no-explicit-any */
import { PlannerTask } from '@microsoft/microsoft-graph-types'
import { FieldCustomizerContext } from '@microsoft/sp-listview-extensibility'
import { GraphFI, SPFx as graphSPFx, graphfi } from '@pnp/graph'
import '@pnp/graph/presets/all'
import { SPFx as spSPFx, spfi } from '@pnp/sp'
import '@pnp/sp/presets/all'
import { IList } from '@pnp/sp/presets/all'
import { SPDataAdapterBase } from 'pp365-shared-library'
import {
  RiskActionItemContext,
  RiskActionHiddenFieldValues,
  RiskActionPlannerTaskReference
} from './types'
import _ from 'underscore'

export class DataAdapter extends SPDataAdapterBase {
  private readonly graph: GraphFI
  private readonly list: IList
  private readonly hiddenDataFieldName = 'RiskActionData'
  private readonly hiddenUpdateFieldName = 'RiskActionUpdated'

  constructor(private readonly _context: FieldCustomizerContext) {
    super()
    this.graph = graphfi().using(graphSPFx(this._context))
    this.sp = spfi().using(spSPFx(this._context))
    this.list = this.sp.web.lists.getById(this._context.pageContext.list.id.toString())
  }

  /**
   * Encodes the provided `url` to be used as a reference in a Planner task.
   *
   * @param url URL to encode
   */
  private encodeUrl(url: string): string {
    return url.split('%').join('%25').split('.').join('%2E').split(':').join('%3A')
  }

  /**
   * Gets the ID of the user with the provided `mail`.
   *
   * @param mail Mail of the user to get the ID for
   */
  private async getUserId(mail: string): Promise<any> {
    const [user] = await this.graph.users.filter(`mail eq '${mail}'`)()
    return user?.id
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
   * Ensures that a bucket with the specified name exists in the specified plan.
   * If the bucket already exists, returns its ID. Otherwise, creates a new bucket and returns its ID.
   *
   * @param planId The ID of the plan to add the bucket to.
   *
   * @returns The ID of the bucket.
   */
  private async _ensureBucket(planId: string): Promise<string> {
    const bucketName = this.globalSettings.get('RiskActionPlannerBucketName')
    const [bucket] = await this.graph.planner.plans
      .getById(planId)
      .buckets.filter(`name eq '${bucketName}'`)()
    if (bucket) return bucket.id
    const bucketAddResult = await this.graph.planner.buckets.add(bucketName, planId, ' !')
    return bucketAddResult.data.id
  }

  /**
   * Adds multiple tasks to the specified Risk Action item context.
   *
   * @param tasks An array of strings representing the titles of the tasks to add.
   * @param itemContext The Risk Action item context to add the tasks to.
   *
   * @returns A Promise that resolves with an array of the newly added tasks.
   */
  public async addTasks(tasks: string[], itemContext: RiskActionItemContext) {
    const newTasks = _.flatten(
      await Promise.all(
        tasks.map(async (title) => this.addTask(new Map([['title', title]]), itemContext))
      )
    )
    return newTasks
  }

  /**
   * Adds a task to the current group's plan.
   *
   * @param model Model for the task (Map<string, any>)
   * @param itemContext Item context for the current risk action item
   */
  public async addTask(
    model: Map<string, any>,
    itemContext: RiskActionItemContext
  ): Promise<PlannerTask> {
    try {
      let assignments = null
      if (model.get('responsible')) {
        const responsible = await this.getUserId(model.get('responsible'))
        assignments = {
          [responsible]: {
            '@odata.type': 'microsoft.graph.plannerAssignment',
            orderHint: ' !'
          }
        }
      }
      const defaultPlan = await this._getDefaultGroupPlan()
      const bucketId = await this._ensureBucket(defaultPlan.id)
      const { task, data } = await this.graph.planner.tasks.add(
        defaultPlan.id,
        model.get('title'),
        null,
        bucketId
      )
      let eTag = data['@odata.etag']
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
          references: {
            [this.encodeUrl(itemContext.url)]: {
              '@odata.type': 'microsoft.graph.plannerExternalReference',
              alias: itemContext.title
            }
          }
        },
        eTag
      )
      return data
    } catch (e) {
      return null
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
      .filter(`planId eq '${defaultPlan.id}' and bucketId eq '${bucketId}'`)
      .select('id', 'title', 'percentComplete')()
    const updatedTasks = itemContext.hiddenFieldValue.tasks
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
    const fieldValue = updatedTasks.map((task) => task.title).join('\n')
    const hiddenFieldValueData = RiskActionPlannerTaskReference.toString(updatedTasks)
    await listItem.update({
      GtRiskAction: fieldValue,
      [this.hiddenDataFieldName]: hiddenFieldValueData,
      [this.hiddenUpdateFieldName]: new Date()
    })
    return {
      ...itemContext,
      fieldValue,
      hiddenFieldValue: {
        data: hiddenFieldValueData,
        tasks: updatedTasks,
        updated: new Date()
      }
    }
  }

  /**
   * Update the current item with the new task's ID and title.
   *
   * @param newTasks The new tasks to add to the current item
   * @param itemContext The item context for the current risk action item
   */
  public async updateItem(
    newTasks: PlannerTask[],
    itemContext: RiskActionItemContext
  ): Promise<RiskActionItemContext> {
    const tasks = [
      ...(itemContext.hiddenFieldValue.tasks ?? []),
      ...newTasks.map<RiskActionPlannerTaskReference>((newTask) => ({
        id: newTask.id,
        title: newTask.title,
        isCompleted: '0'
      }))
    ]
    const hiddenFieldValue = RiskActionPlannerTaskReference.toString(tasks)
    const fieldValue = tasks.map((task) => task.title).join('\n')
    const listItem = this.list.items.getById(itemContext.id)
    await listItem.update({
      GtRiskAction: fieldValue,
      [this.hiddenDataFieldName]: hiddenFieldValue
    })
    return {
      ...itemContext,
      fieldValue,
      hiddenFieldValue: {
        ...itemContext.hiddenFieldValue,
        data: hiddenFieldValue,
        tasks
      }
    }
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
   * Gets the hidden field values for the current list.
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
