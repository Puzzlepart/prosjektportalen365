import { IProjectPhaseChecklistItem } from 'pp365-shared/lib/models'
import { View } from '../Views'

export default interface IBodyProps {

  /**
   * Check list items
   */
  checklistItems: IProjectPhaseChecklistItem[]

  /**
   * Current index
   */
  currentIdx: number

  /**
   * Next checkpoint action callback
   */
  saveCheckPoint: (
    statusValue: string,
    commentsValue: string,
    updateStatus: boolean
  ) => Promise<void>

  /**
   * Current view
   */
  view: View
}
