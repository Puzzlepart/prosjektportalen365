import { IProjectPhaseChecklistItem } from 'pp365-shared/lib/models'
import { INextCheckpointParams } from '../nextCheckpoint'
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
   * 
   * @param {INextCheckpointParams} params Params
   */
  nextCheckpoint: (params: INextCheckpointParams) => Promise<void>

  /**
   * Current view
   */
  view: View
}
