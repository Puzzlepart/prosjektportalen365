import { IBaseComponentProps } from '../types'
import { ITimelineData } from 'pp365-shared-library/lib/interfaces'

/** Allocation source, search fields, colors and initial timeline range. */
export interface IResourceAllocationProps extends IBaseComponentProps {
  dataSource: string

  /**
   * Comma-separated RGB channels for allocation bars.
   */
  itemColor?: string

  /**
   * Comma-separated RGB channels for absence bars.
   */
  itemAbsenceColor?: string

  selectProperties?: string[]

  /**
   * Initial lookback as an amount and Moment unit, for example `4,months`.
   */
  defaultTimeframeStart?: string

  /**
   * Initial lookahead as an amount and Moment unit, for example `4,months`.
   */
  defaultTimeframeEnd?: string
}

/** Loaded timeline data and active allocation filters. */
export interface IResourceAllocationState {
  activeFilters: { [key: string]: string[] }

  data?: ITimelineData

  error?: string

  loading?: boolean
}
