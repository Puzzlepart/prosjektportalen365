import {
  ProjectPhaseChecklistData,
  ProjectPhaseModel,
  DocumentTypeModel
} from 'pp365-shared-library/lib/models'
import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState
} from 'pp365-shared-library/lib/components/BaseWebPartComponent'
import { IProjectPhasePopoverProps } from './ProjectPhase/ProjectPhasePopover'
import { IArchiveItem } from './ChangePhaseDialog/Views/ArchiveView/types'
import { IArchiveStatusInfo } from '../../data/SPDataAdapter/types'

/** Configures phase visibility, checkpoints, archiving and phase-change hooks. */
export interface IProjectPhasesProps extends IBaseWebPartComponentProps {
  phaseField: string

  currentPhaseViewName: string

  showSubText: boolean

  subTextTruncateLength: number

  /**
   * Sync properties to the portal site (hub site in SharePoint terms)
   * after phase change.
   */
  syncPropertiesAfterPhaseChange: boolean

  useStartArrow: boolean

  useEndArrow: boolean

  /**
   * Show phase site page message when switching phases if dynamic homepage is used
   */
  showPhaseSitePageMessage: boolean

  /**
   * Use dynamic homepage when switching phases
   */
  useDynamicHomepage: boolean

  /**
   * Use and run hooks when switching phases. Needs to specify `hookUrl` and `hookAuth`
   * as well as setting this to `true` to use this functionality.
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
   * Use archive functionality when switching phases
   */
  useArchive: boolean

  /**
   * Archive hook URL - for running archive hooks when switching phases
   */
  hookArchiveUrl: string

  /**
   * Archive hook auth - for authing archive hooks when switching phases
   */
  hookArchiveAuth: string

  /**
   * Comment min. length
   *
   * @default 4
   */
  commentMinLength?: number
}

/** Loaded phases and the state of phase details and pending changes. */
export interface IProjectPhasesState extends IBaseWebPartComponentState<IProjectPhasesData> {
  phase?: ProjectPhaseModel

  confirmPhase?: ProjectPhaseModel

  isChangingPhase?: boolean

  popover?: IProjectPhasePopoverProps

  /**
   * Warning shown when the phase was changed on the project but not in the hub, with the reason
   */
  hubSyncWarning?: string

  /**
   * Warning shown when the phase was changed but the archiving was not written to the hub's
   * archive log (`Arkiveringslogg`), with the reason
   */
  archiveLogWarning?: string
}

/** Checkpoint data keyed by phase. */
export type ChecklistData = Record<string, ProjectPhaseChecklistData>

/** Phases, current project phase, archive candidates and change permissions. */
export interface IProjectPhasesData {
  phases?: ProjectPhaseModel[]

  currentPhase?: ProjectPhaseModel

  checklistData?: ChecklistData

  /**
   * Phase field. Used to update the phase
   * of the project. This is the `TextField` that is
   * connected to the term field in SharePoint.
   */
  phaseField?: {
    fieldName?: string
    termSetId?: string
    textField?: string
  }

  phaseSitePages?: IPhaseSitePageModel[]

  welcomePage?: string

  /**
   * Current user has change phase permission (`75a08ae0-d69a-41b2-adf4-ae233c6bff9f`)
   */
  userHasChangePhasePermission?: boolean

  archiveDocuments?: IArchiveItem[]

  archiveLists?: IArchiveItem[]

  /**
   * Document types available for archiving
   */
  documentTypes?: DocumentTypeModel[]

  /**
   * Archive status information for the project
   */
  archiveStatus?: IArchiveStatusInfo
}

/** Project page that can become the homepage for a matching phase. */
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
