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

  /**
   * Current user has admin permissions
   */
   userHasAdminPermission?: boolean
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

  /**
   * Phase site pages
   */
  phaseSitePages?: IPhaseSitePageModel[]

  /**
   * Welcome page of web
   */
  welcomePage?: string

  /**
   * Current user has admin permissions
   */
   userHasAdminPermission?: boolean
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
