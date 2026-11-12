import { ChecklistItemModel } from 'pp365-shared-library/lib/models'
import { View } from './Views'
import { IArchiveConfiguration } from './Views/ArchiveView'

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
