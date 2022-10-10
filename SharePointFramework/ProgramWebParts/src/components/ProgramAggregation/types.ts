import { Target } from 'office-ui-fabric-react'
import { IColumn, IGroup } from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { DataSource } from 'pp365-shared/lib/models/DataSource'
import { IBaseProgramWebPartProps } from 'webparts/baseProgramWebPart'

export class ProgramAggregationErrorMessage extends Error {
  constructor(public message: string, public type: MessageBarType) {
    super(message)
  }
}

export interface IProgramAggregationProps extends IBaseProgramWebPartProps {
  /**
   * Data source name
   */
  dataSource?: string

  /**
   * Columns
   */
  columns?: IColumn[]

  /**
   * Select properties
   */
  selectProperties?: string[]

  /**
   * Show command bar
   */
  showCommandBar?: boolean

  /**
   * Show search box
   */
  showSearchBox?: boolean

  /**
   * Show filters
   */
  showFilters?: boolean

  /**
   * Placeholder text for searchbox
   */
  searchBoxPlaceholderText?: string

  /**
   * Show Excel export button
   */
  showExcelExportButton?: boolean

  /**
   * Show Excel export button
   */
  showViewSelector?: boolean

  /**
   * Default view id
   */
  defaultViewId?: string

  /**
   * Locked columns
   */
  lockedColumns?: boolean

  /**
   * On update property
   */
  onUpdateProperty?: (key: string, value: any) => void
}

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
