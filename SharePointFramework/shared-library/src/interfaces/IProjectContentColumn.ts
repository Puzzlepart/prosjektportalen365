import { IColumn } from '@fluentui/react'

export interface IProjectContentColumn extends IColumn {
  id?: number
  internalName?: string
  sortOrder?: number
  dataType?: string
}
