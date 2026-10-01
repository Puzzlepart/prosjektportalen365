import { IListColumn } from '../types'

export interface IProjectColumn extends IListColumn {
  id?: number
  internalName?: string
  sortOrder?: number
  dataType?: string
}
