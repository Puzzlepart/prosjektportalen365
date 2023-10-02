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
  IRiskActionItemContext,
  RiskActionHiddenFieldValues,
  RiskActionPlannerTaskReference
} from './types'

export class DataAdapter extends SPDataAdapterBase<any> {
  private readonly graph: GraphFI
  private readonly list: IList
  private readonly hiddenDataFieldName: string
  private readonly hiddenUpdateFieldName: string

  constructor(private readonly _context: FieldCustomizerContext) {
    super()
    this.graph = graphfi().using(graphSPFx(this._context))
    this.sp = spfi().using(spSPFx(this._context))
    this.list = this.sp.web.lists.getById(this._context.pageContext.list.id.toString())
    this.hiddenDataFieldName = 'RiskActionData'
    this.hiddenUpdateFieldName = 'RiskActionUpdated'
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
   * Adds a task to the current group's plan.
   *
   * @param model Model for the task (Map<string, any>)
   * @param itemContext Item context for the current risk action item
   */
  public async addTask(
    model: Map<string, any>,
    itemContext: IRiskActionItemContext
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
      const { task, data } = await this.graph.planner.tasks.add(defaultPlan.id, model.get('title'))
      let eTag = data['@odata.etag']
      if (assignments) await task.update({ assignments }, eTag)
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
  public async syncTasks(itemContext: IRiskActionItemContext): Promise<IRiskActionItemContext> {
    const defaultPlan = await this._getDefaultGroupPlan()
    const tasks = await this.graph.planner.tasks
      .filter(`planId eq '${defaultPlan.id}'`)
      .select('id', 'title', 'percentComplete')()
    const updatedTasks = itemContext.hiddenFieldValue.tasks
      .map<RiskActionPlannerTaskReference>((task) => {
        const updatedTask = tasks.find((t) => t.id === task.id)
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
   * @param newTask The new task created in Planner
   * @param itemContext The item context for the current risk action item
   */
  public async updateItem(
    newTask: PlannerTask,
    itemContext: IRiskActionItemContext
  ): Promise<IRiskActionItemContext> {
    const tasks = [
      ...(itemContext.hiddenFieldValue.tasks ?? []),
      {
        id: newTask.id,
        title: newTask.title,
        isCompleted: newTask.percentComplete === 100 ? '1' : '0'
      }
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
