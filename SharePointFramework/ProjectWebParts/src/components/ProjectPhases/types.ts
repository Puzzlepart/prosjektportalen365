import { IProjectPhaseChecklistItem, ProjectPhaseModel } from 'pp365-shared/lib/models'
import { IBaseWebPartComponentProps, IBaseWebPartComponentState } from '../BaseWebPartComponent'
import { IProjectPhaseMouseOver } from './ProjectPhaseCallout'

export interface IProjectPhasesProps extends IBaseWebPartComponentProps {
  /**
   * Field name for phase field
   */
  phaseField: string

  /**
   * Should phase change be confirmed
   */
  confirmPhaseChange: boolean

  /**
   * View name for current phase
   */
  currentPhaseViewName: boolean
}

export interface IProjectPhasesState extends IBaseWebPartComponentState<IProjectPhasesData> {
  /**
   * Confirm phase
   */
  confirmPhase?: ProjectPhaseModel

  /**
   * Is changing phase
   */
  isChangingPhase?: boolean

  /**
   * Phase mouse over
   */
  phaseMouseOver?: IProjectPhaseMouseOver
}

export type ChecklistData = {
  [termGuid: string]: { stats: { [status: string]: number }; items: IProjectPhaseChecklistItem[] }
}

export interface IProjectPhasesData {
  /**
   * Phases
   */
  phases?: ProjectPhaseModel[]

  /**
   * Current phase
   */
  currentPhase?: ProjectPhaseModel

  /**
   * Check list data
   */
  checklistData?: ChecklistData

  /**
   * Phase text field name
   */
  phaseTextField?: string
}
