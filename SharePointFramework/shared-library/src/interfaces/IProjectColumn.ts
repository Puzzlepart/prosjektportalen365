import { IListColumn } from '../types'

/**
 * Extends a list column with persisted project-column metadata.
 */
export interface IProjectColumn extends IListColumn {
  id?: number
  internalName?: string
  sortOrder?: number
  dataType?: string
}
