import { IColumn } from '@fluentui/react'

export interface IProjectColumn extends IColumn {
  id?: number
  internalName?: string
  sortOrder?: number
  dataType?: string
}
