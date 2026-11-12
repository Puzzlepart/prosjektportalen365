import { IListColumn } from 'pp365-shared-library'

/** Loading, error and persisted-data state for a list-backed report section. */
export interface IListSectionState<T> {
  isDataLoaded?: boolean

  data?: T

  error?: any
}

/** List rows, columns and optional aggregate shown in a report section. */
export interface IListSectionData {
  columns?: IListColumn[]
  items?: any[]
  summation?: ISummation
}

/** Aggregate result and display format for a section's numeric field. */
export interface ISummation {
  result?: string | number
  description?: string
  renderAs?: 'number' | 'currency' | 'percentage'
}
