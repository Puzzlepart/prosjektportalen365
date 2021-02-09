import { IProjectPhaseChecklistItem } from 'pp365-shared/lib/models'

export interface IInitialViewProps {
  /**
   * Current check list items
   */
  checklistItem: IProjectPhaseChecklistItem

  /**
   * Next check point ation callback
   */
  saveCheckPoint: (statusValue: string, commentsValue: string, updateStatus: boolean) => void

  /**
   * Min length for comment
   */
  commentMinLength?: number

  /**
   * Style for comment field
   */
  commentStyle?: React.CSSProperties
}
