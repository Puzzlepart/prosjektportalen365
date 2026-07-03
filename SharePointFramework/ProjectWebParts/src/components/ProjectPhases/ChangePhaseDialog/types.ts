import { ChecklistItemModel } from 'pp365-shared-library/lib/models'
import { View } from './Views/View'
import { IArchiveConfiguration } from '../../ArchiveDialog/ArchiveSelection/types'

/** Checkpoint progress, selected archive items and active dialog step. */
export interface IChangePhaseDialogState {
  checklistItems?: ChecklistItemModel[]

  currentIdx?: number

  isChecklistMandatory?: boolean

  view?: View

  /**
   * Archive configuration when useArchive is enabled
   */
  archiveConfiguration?: IArchiveConfiguration
}
