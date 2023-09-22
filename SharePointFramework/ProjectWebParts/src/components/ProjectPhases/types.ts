import { ProjectPhaseChecklistData, ProjectPhaseModel } from 'pp365-shared-library/lib/models'
import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState
} from 'pp365-shared-library/lib/components/BaseWebPartComponent'
import { IProjectPhasePopoverProps } from './ProjectPhase/ProjectPhasePopover'

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
   * Sync properties to the portal site (hub site in SharePoint terms)
   * after phase change.
   */
  syncPropertiesAfterPhaseChange: boolean

  /**
   * Use start arrow
   */
  useStartArrow: boolean

  /**
   * Use end arrow
   */
  useEndArrow: boolean

  /**
   * Use dynamic homepage when switching phases
   */
  useDynamicHomepage: boolean

  /**
   * Use and run hooks when switching phases. Needs to specify `hookUrl` and `hookAuth`
   * aswell as setting this to `true` to use this functionality.
   */
  usePhaseHooks: boolean

  /**
   * Hook URL - for running hooks when switching phases
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
   * Popover props
   */
  popover?: IProjectPhasePopoverProps
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
   * Phase text field name. Used to update the phase
   * of the project. This is the `TextField` that is
   * connected to the term field in SharePoint.
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
   * Current user has change phase permission (`75a08ae0-d69a-41b2-adf4-ae233c6bff9f`)
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
