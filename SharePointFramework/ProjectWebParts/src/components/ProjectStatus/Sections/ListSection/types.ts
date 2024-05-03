import { IColumn } from '@fluentui/react/lib/DetailsList'

export interface IListSectionState<T> {
  /**
   * The component has loaded the neccessary data
   */
  isDataLoaded?: boolean

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
  columns?: IColumn[]
  items?: any[]
  summation?: ISummation
}

export interface ISummation {
  result?: string | number
  description?: string
  renderAs?: 'number' | 'currency' | 'percentage'
}
