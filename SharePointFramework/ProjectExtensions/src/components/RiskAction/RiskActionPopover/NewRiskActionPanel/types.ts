import { IBasePanelProps, IPersonaItem } from 'pp365-shared-library'

/**
 * The panel takes the base panel's props: `open`, `onClose` and the rest.
 */
export type INewRiskActionPanelProps = IBasePanelProps

/**
 * What the user fills in for a new task.
 */
export interface INewRiskActionForm {
  /**
   * The task's title, required.
   */
  title: string

  /**
   * The task's description.
   */
  description: string

  /**
   * The day the task starts, at local midnight, as the picker gives it.
   */
  startDate?: Date

  /**
   * The day the task is due, at local midnight.
   */
  dueDate?: Date

  /**
   * The responsible, at most one; the email is what identifies them in Planner.
   */
  responsible: IPersonaItem[]

  /**
   * Whether the panel stays open after a save, to add another task.
   */
  createMultiple: boolean
}
