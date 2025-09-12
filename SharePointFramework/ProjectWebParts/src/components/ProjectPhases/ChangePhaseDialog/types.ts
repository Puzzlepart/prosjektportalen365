import { ChecklistItemModel } from 'pp365-shared-library/lib/models'
import { View } from './Views'
import { IArchiveConfiguration } from './Views/ArchiveView'

export interface IChangePhaseDialogState {
  /**
   * Check list items
   */
  checklistItems?: ChecklistItemModel[]

  /**
   * Currently selected index
   */
  currentIdx?: number

  /**
   * Is checklist mandatory
   */
  isChecklistMandatory?: boolean

  /**
   * Currently selected view
   */
  view?: View

  /**
   * Archive configuration when useArchive is enabled
   */
  archiveConfiguration?: IArchiveConfiguration
}
