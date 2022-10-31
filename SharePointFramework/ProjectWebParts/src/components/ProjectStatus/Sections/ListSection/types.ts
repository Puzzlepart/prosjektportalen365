import { IColumn } from '@fluentui/react/lib/DetailsList'

export interface IListSectionState<T> {
  /**
   * Whether the component is loading
   */
  loading?: boolean

  /**
   * Data
   */
  data?: T

  /**
   * Error
   */
  error?: any
}

export interface IListSectionData {
  columns: IColumn[]
  items: any[]
}
