import { IListColumn } from '../types'

/**
 * Defines display and grouping metadata for project-content columns.
 */
export interface IProjectContentColumn extends IListColumn {
  id?: number
  internalName?: string
  sortOrder?: number
  dataType?: string
  data?: {
    isGroupable?: boolean
    isSelected?: boolean
    renderAs?: string
    isLocked?: boolean
  }
}
