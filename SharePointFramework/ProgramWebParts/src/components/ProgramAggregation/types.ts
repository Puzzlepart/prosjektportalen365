import { MessageBarType, IColumn, IGroup, Target } from '@fluentui/react'
import { IPortfolioAggregationProps } from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import { DataSource } from 'pp365-shared/lib/models/DataSource'
import { IBaseProgramWebPartProps } from 'webparts/baseProgramWebPart'

export class ProgramAggregationErrorMessage extends Error {
  constructor(public message: string, public type: MessageBarType) {
    super(message)
  }
}

export interface IProgramAggregationProps extends Omit<IBaseProgramWebPartProps, 'dataAdapter'>, IPortfolioAggregationProps {}

export interface IProgramAggregationState {
  /**
   * Whether the component is loading
   */
  loading?: boolean

  /**
   * Whether there's an export in progress
   */
  isExporting?: boolean

  /**
   * Data source name
   */
  dataSource?: string

  /**
   * Items to show in the details list
   */
  items?: any[]

  /**
   * Columns
   */
  columns?: IColumn[]

  /**
   * Groups
   */
  groups?: IGroup[]

  /**
   * Column to group by
   */
  groupBy?: IColumn

  /**
   * Column to sort by
   */
  sortBy?: IColumn

  /**
   * Search term
   */
  searchTerm?: string

  /**
   * Error
   */
  error?: Error

  /**
   * Is compact
   */
  isCompact?: boolean

  /**
   * Current view
   */
  currentView?: DataSource

  /**
   * Column context menu
   */
  columnContextMenu?: { column: IColumn; target: Target }
}
