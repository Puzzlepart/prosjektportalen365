import { IProjectPhaseChecklistItem, ProjectPhaseModel } from 'pp365-shared/lib/models'
import { IBaseWebPartComponentProps, IBaseWebPartComponentState } from '../BaseWebPartComponent'
import { IProjectPhaseCalloutProps } from './ProjectPhase/ProjectPhaseCallout'

export interface IProjectPhasesProps extends IBaseWebPartComponentProps {
  /**
   * Field name for phase field
   */
  phaseField: string

  /**
   * View name for current phase
   */
  currentPhaseViewName: string

  /**
   * Show sub text
   */
  showSubText: boolean

  /**
   * Sub text truncate length
   */
  subTextTruncateLength: number

  /**
   * Sync properties after phase change
   */
  syncPropertiesAfterPhaseChange: boolean

  /**
   * If the site uses a dynamic homepage based off of the phase
   */
  useDynamicHomepage: boolean
}

export interface IProjectPhasesState extends IBaseWebPartComponentState<IProjectPhasesData> {
  /**
   * Phase
   */
  phase?: ProjectPhaseModel

  /**
   * Phase to be confirmed using ChangePhaseDialog
   */
  confirmPhase?: ProjectPhaseModel

  /**
   * Is changing phase
   */
  isChangingPhase?: boolean

  /**
   * Callout
   */
  callout?: IProjectPhaseCalloutProps
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
