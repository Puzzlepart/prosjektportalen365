import { IPhaseChecklistItem, Phase } from 'models'
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
  confirmPhase?: Phase

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
  [termGuid: string]: { stats: { [status: string]: number }; items: IPhaseChecklistItem[] }
}

export interface IProjectPhasesData {
  /**
   * Phases
   */
  phases?: Phase[]

  /**
   * Current phase
   */
  currentPhase?: Phase

  /**
   * Check list data
   */
  checklistData?: ChecklistData

  /**
   * Phase text field name
   */
  phaseTextField?: string
}
