import { PlannerExternalReferences } from '@microsoft/microsoft-graph-types'
import { IFieldCustomizerCellEventParameters } from '@microsoft/sp-listview-extensibility'
import { PageContext } from '@microsoft/sp-page-context'

/**
 * Represents the context object passed to the field customizer for a risk action item.
 */
export class RiskActionItemContext {
  /**
   * The ID of the risk action item.
   */
  public id: number

  /**
   * The title of the risk action item.
   */
  public title: string

  /**
   * The value of the field associated with the risk action item.
   */
  public fieldValue: string

  /**
   * The hidden values of the field associated with the risk action item.
   */
  public hiddenFieldValue: RiskActionHiddenFieldValues

  /**
   * Represents a RiskAction object.
   *
   * @constructor
   *
   * @param _event - The `IFieldCustomizerCellEventParameters` object
   * @param _pageContext - The `PageContext` object
   * @param hiddenFieldValues - The Map object containing hidden field values.
   */
  private constructor(
    private _event: IFieldCustomizerCellEventParameters,
    private _pageContext: PageContext,
    hiddenFieldValues: Map<string, any> = new Map<string, any>()
  ) {
    this.id = _event.listItem.getValueByName('ID')
    this.title = _event.listItem.getValueByName('Title').toString()
    this.fieldValue = _event.fieldValue
    this.hiddenFieldValue = hiddenFieldValues.get(this.id.toString())
  }

  /**
   * The reference to the risk action item used for the Planner tasks.
   */
  public get references(): PlannerExternalReferences {
    const url = `${window.location.protocol}//${window.location.host}${this._pageContext?.list?.serverRelativeUrl}/DispForm.aspx?ID=${this.id}`
    return {
      [this._encodeUrl(url)]: {
        '@odata.type': 'microsoft.graph.plannerExternalReference',
        alias: this.title
      }
    }
  }

  /**
   * Updates the current RiskActionItemContext with the provided tasks.
   *
   * @param tasks An array of RiskActionPlannerTaskReference objects to update the context with.
   *
   * @returns The updated RiskActionItemContext object.
   */
  public update(tasks: RiskActionPlannerTaskReference[]): RiskActionItemContext {
    const newContext = new RiskActionItemContext(this._event, this._pageContext)
    newContext.fieldValue = tasks.map((task) => task.title).join('\n')
    newContext.hiddenFieldValue = {
      ...this.hiddenFieldValue,
      data: RiskActionPlannerTaskReference.toString(tasks),
      tasks
    }
    return newContext
  }

  /**
   * Encodes the provided `url` to be used as a reference in a Planner task.
   *
   * @param url URL to encode
   */
  private _encodeUrl(url: string): string {
    return url.split('%').join('%25').split('.').join('%2E').split(':').join('%3A')
  }

  /**
   * Creates a new instance of the RiskActionItemContext class.
   *
   * @param event - The field customizer cell event parameters.
   * @param pageContext - The SharePoint page context.
   * @param hiddenFieldValues - The hidden field values.
   *
   * @returns A new instance of the RiskActionItemContext class.
   */
  public static create(
    event: IFieldCustomizerCellEventParameters,
    pageContext: PageContext,
    hiddenFieldValues: Map<string, any>
  ): RiskActionItemContext {
    return new RiskActionItemContext(event, pageContext, hiddenFieldValues)
  }
}

export class RiskActionPlannerTaskReference {
  public id: string
  public title: string
  public isCompleted: string

  /**
   * Parses a string value and returns an array of `RiskActionPlannerTaskReference` objects.
   *
   * @param value - The string value to parse.
   *
   * @returns An array of `RiskActionPlannerTaskReference` objects.
   */
  public static fromString(value: string): RiskActionPlannerTaskReference[] {
    return (
      value
        .split('|')
        .filter(Boolean)
        .map((part: string) => part.split(','))
        .map<RiskActionPlannerTaskReference>(([id, title, isCompleted]) => ({
          id,
          title: decodeURIComponent(title),
          isCompleted
        })) ?? []
    )
  }

  /**
   * Returns a string representation of an array of `RiskActionPlannerTaskReference` objects.
   *
   * @param value - The array of `RiskActionPlannerTaskReference` objects to convert to a string.
   *
   * @returns A string representation of the array of `RiskActionPlannerTaskReference` objects.
   */
  public static toString(value: RiskActionPlannerTaskReference[]): string {
    return value
      .map((task) => `${task.id},${encodeURIComponent(task.title)},${task.isCompleted}`)
      .join('|')
  }
}

export type RiskActionHiddenFieldValues = {
  data: string
  tasks: RiskActionPlannerTaskReference[]
  updated: Date | string
}
