import { IFieldCustomizerCellEventParameters } from '@microsoft/sp-listview-extensibility'

/**
 * Represents the context object passed to the field customizer for a risk action item.
 */
export interface IRiskActionItemContext extends IFieldCustomizerCellEventParameters {
  /**
   * The ID of the risk action item.
   */
  id: number

  /**
   * The title of the risk action item.
   */
  title: string

  /**
   * The URL of the risk action item.
   */
  url: string

  /**
   * The hidden value of the field associated with the risk action item.
   */
  hiddenFieldValue: RiskActionHiddenFieldValues
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
          title,
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
    return value.map((task) => `${task.id},${task.title},${task.isCompleted}`).join('|')
  }
}

export type RiskActionHiddenFieldValues = {
  data: string
  tasks: RiskActionPlannerTaskReference[]
  updated: any
}
