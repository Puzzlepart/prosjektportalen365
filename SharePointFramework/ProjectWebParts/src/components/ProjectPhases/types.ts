import {
  ProjectPhaseChecklistData,
  ProjectPhaseModel
} from 'pp365-shared-library/lib/models'
import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState
} from '../BaseWebPartComponent'
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
   * Use dynamic homepage when switching phases
   */
  useDynamicHomepage: boolean

  /**
   * Use and run hooks when switching phases
   */
  usePhaseHooks: boolean

  /**
   * Hook url - for running hooks when switching phases
   */
  hookUrl: string

  /**
   * Hook auth - for authing hooks when switching phases
   */
  hookAuth: string

  /**
   * Comment min. length
   *
   * @default 4
   */
  commentMinLength?: number
}

export interface IProjectPhasesState
  extends IBaseWebPartComponentState<IProjectPhasesData> {
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
   * Callout props
   */
  callout?: IProjectPhaseCalloutProps
}

export type ChecklistData = Record<string, ProjectPhaseChecklistData>

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

  /**
   * Phase site pages
   */
  phaseSitePages?: IPhaseSitePageModel[]

  /**
   * Welcome page of web
   */
  welcomePage?: string

  /**
   * Current user has change phase permission (75a08ae0-d69a-41b2-adf4-ae233c6bff9f)
   */
  userHasChangePhasePermission?: boolean
}

export interface IPhaseSitePageModel {
  /**
   * Id of phase site page
   */
  id?: number

  /**
   * Title of phase site page
   */
  title?: string

  /**
   * FileLeafRef of phase site page
   */
  fileLeafRef?: string
}
