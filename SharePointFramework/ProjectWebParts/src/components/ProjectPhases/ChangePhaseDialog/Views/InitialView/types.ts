import { IProjectPhaseChecklistItem } from 'pp365-shared/lib/models'
import { INextCheckpointParams } from '../../nextCheckpoint'

export interface IInitialViewProps {
  /**
   * Current check list items
   */
  checklistItem: IProjectPhaseChecklistItem

  /**
   * Next checkpoint action callback
   * 
   * @param {INextCheckpointParams} params Params
   */
  nextCheckpoint: (params: INextCheckpointParams) => Promise<void>

  /**
   * Style for comment field
   */
  commentStyle?: React.CSSProperties
}
