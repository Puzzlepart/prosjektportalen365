import { IColumn } from 'office-ui-fabric-react'

export interface IProjectContentColumn extends IColumn {
  id?: number
  internalName?: string
  sortOrder?: number
}
