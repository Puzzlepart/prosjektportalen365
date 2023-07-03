import { IColumn, IGroup, IPanelProps, MessageBarType, Target } from '@fluentui/react'
import { SearchResult } from '@pnp/sp'
import strings from 'PortfolioWebPartsStrings'
import { IDataAdapter } from 'data/types'
import { IAggregatedListConfiguration } from 'interfaces'
import { IFilterProps } from 'pp365-shared-library/lib/components/FilterPanel'
import { DataSource } from 'pp365-shared-library/lib/models/DataSource'
import { IBaseComponentProps } from '../types'
import styles from './PortfolioAggregation.module.scss'
import { IProjectContentColumn } from 'pp365-shared-library'

export class PortfolioAggregationErrorMessage extends Error {
  constructor(public message: string, public type: MessageBarType) {
    super(message)
  }
}

export interface IPortfolioAggregationProps<T = any> extends IBaseComponentProps {
  /**
   * Configuration (columns and views etc)
   */
  configuration?: IAggregatedListConfiguration

  /**
   * Data source name
   */
  dataSource?: string

  /**
   * Category for data sources
   */
  dataSourceCategory?: string

  /**
   * Data source level is used to filter data sources
   * by level. This is either set specifically by the
   * user in the web part properties or calculated
   * in the web part itself.
   */
  dataSourceLevel?: string

  /**
   * Columns
   */
  columns?: IProjectContentColumn[]

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
   * Data adapter
   */
  dataAdapter?: IDataAdapter

  /**
   * On update property
   */
  onUpdateProperty?: (key: string, value: any) => void

  /**
   * Transforms the data after it's fetched
   */
  postTransform?: (results: SearchResult[]) => T[]
}

export interface IPortfolioAggregationState
  extends Pick<IPortfolioAggregationProps, 'dataSource' | 'dataSourceLevel'> {
  /**
   * Whether the component is loading
   */
  loading?: boolean

  /**
   * Whether there's an export in progress
   */
  isExporting?: boolean

  /**
   * Data sources
   */
  dataSources?: DataSource[]

  /**
   * Items to show in the details list
   */
  items?: any[]

  /**
   * Columns
   */
  columns?: IProjectContentColumn[]

  /**
   * Filtered columns
   */
  fltColumns?: IProjectContentColumn[]

  /**
   * Groups
   */
  groups?: IGroup[]

  /**
   * Column currently being edited
   */
  editColumn?: IProjectContentColumn

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
   * Add column panel
   */
  addColumnPanel?: IPanelProps

  /**
   * Show/hide column panel
   */
  showHideColumnPanel?: IPanelProps

  /**
   * Column context menu
   */
  columnContextMenu?: { column: IColumn; target: Target }

  /**
   * Column added timestamp
   */
  columnAdded?: number

  /**
   * Column deleted timestamp
   */
  columnDeleted?: number

  /**
   * Column shown/hidden timestamp
   */
  columnShowHide?: number

  /**
   * Error
   */
  error?: Error

  /**
   * Show filter panel
   */
  showFilterPanel?: boolean

  /**
   * Is compact
   */
  isCompact?: boolean

  /**
   * Active filters
   */
  activeFilters?: { SelectedColumns?: string[]; [key: string]: string[] }

  /**
   * Filters
   */
  filters?: IFilterProps[]

  /**
   * Current view
   */
  currentView?: DataSource
}

export interface IPortfolioAggregationHashState {
  /**
   * viewId found in hash (document.location.hash)
   */
  viewId?: string

  /**
   * groupBy found in hash (document.location.hash)
   */
  groupBy?: string
}

export const addColumn: IColumn = {
  key: 'AddColumn',
  fieldName: '',
  name: strings.AddColumnText,
  iconName: 'CalculatorAddition',
  iconClassName: styles.addColumnIcon,
  minWidth: 175
}
