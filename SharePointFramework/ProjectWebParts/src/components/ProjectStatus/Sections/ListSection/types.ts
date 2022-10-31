import { IColumn } from '@fluentui/react/lib/DetailsList'
import { IBaseSectionProps, IBaseSectionState } from '../BaseSection'

export type IListSectionProps = IBaseSectionProps

export interface IListSectionState<T> extends IBaseSectionState {
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
