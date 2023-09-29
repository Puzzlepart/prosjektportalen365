/* eslint-disable @typescript-eslint/no-explicit-any */
import { PlannerTask } from '@microsoft/microsoft-graph-types'
import { FieldCustomizerContext } from '@microsoft/sp-listview-extensibility'
import { GraphFI, SPFx as graphSPFx, graphfi } from '@pnp/graph'
import '@pnp/graph/presets/all'
import { SPFI, SPFx as spSPFx, spfi } from '@pnp/sp'
import '@pnp/sp/presets/all'
import { IRiskActionProps } from './components/RiskAction/types'
import { IList } from '@pnp/sp/presets/all'

export class DataAdapter {
  private readonly graph: GraphFI
  private readonly sp: SPFI
  private readonly list: IList
  private readonly hiddenFieldName: string

  constructor(
    private readonly context: FieldCustomizerContext
  ) { 

    this.graph = graphfi().using(graphSPFx(this.context))
    this.sp = spfi().using(spSPFx(this.context))
    this.list =  this.sp.web.lists.getById(this.context.pageContext.list.id.toString())
    this.hiddenFieldName = 'RiskActionData'
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
   * Adds a task to the current group's plan.
   *
   * @param title Title of the task
   * @param description Description of the task
   * @param props props for the `RiskAction` component
   */
  public async addTask(
    title: string,
    description: string,
    props: IRiskActionProps
  ): Promise<PlannerTask> {
    try {
      const group = this.graph.groups.getById(this.context.pageContext.legacyPageContext.groupId)
      const [plan] = await group.plans()
      const { task, data } = await this.graph.planner.tasks.add(plan.id, title, null)
      const details = await task.details<any>()
      await task.details.update(
        {
          description,
          references: {
            [this.encodeUrl(props.itemContext.url)]: {
              '@odata.type': 'microsoft.graph.plannerExternalReference',
              alias: props.itemContext.title
            }
          }
        },
        details['@odata.etag']
      )
      return data
    } catch (e) {
      return null
    }
  }

  /**
   * Update the current item with the new task's ID and title.
   *
   * @param newTask The new task created in Planner
   * @param props Props for the `RiskAction` component
   */
  public async updateItem(
    newTask: PlannerTask,
    props: IRiskActionProps
  ): Promise<void> {
    const hiddenFieldValueParts = [
      ...(props.itemContext.hiddenFieldValue ?? '').split('|').filter(Boolean),
      `${newTask.id},${newTask.title}`
    ]
    const newHiddenFieldValue = hiddenFieldValueParts.join('|')
    const newFieldValue = hiddenFieldValueParts.map((part) => part.split(',')[1]).join(', ')
    const listItem = this.list.items.getById(props.itemContext.id)
    await listItem.update({
      GtRiskAction: newFieldValue,
      [this.hiddenFieldName]: newHiddenFieldValue
    })
  }

  /**
   * Ensures the hidden field exists on the current list.
   */
  public async ensureHiddenField(): Promise<void> {
    if ((await this.list.fields.filter(`InternalName eq '${this.hiddenFieldName}'`)()).length === 1) return
    await this.list.fields.addMultilineText(this.hiddenFieldName, {
      Hidden: true,
      Indexed: false
    })
  }

  /**
   * Gets the hidden field values for the current list.
   */
  public async getHiddenFieldValues(): Promise<Map<string, any>> {
    try {
      const hiddenFieldValues = await this.list.items.select('Id', this.hiddenFieldName)()
      return hiddenFieldValues.reduce((acc, item) => {
        acc.set(item.Id.toString(), item[this.hiddenFieldName])
        return acc
      }, new Map<string, any>())
    } catch (e) {
      return new Map<string, any>()
    }
  }
}
