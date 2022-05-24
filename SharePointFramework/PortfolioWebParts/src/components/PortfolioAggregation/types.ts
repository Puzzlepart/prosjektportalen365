import { SearchResult } from '@pnp/sp'
import { IFilterProps } from 'components/FilterPanel'
import { IDataAdapter } from 'data/types'
import { IProjectContentColumn } from 'interfaces/IProjectContentColumn'
import { Target } from 'office-ui-fabric-react/lib/Callout'
import { IColumn, IGroup } from 'office-ui-fabric-react/lib/DetailsList'
import { IPanelProps } from 'office-ui-fabric-react/lib/Panel'
import { DataSource } from 'pp365-shared/lib/models/DataSource'
import { IBaseComponentProps } from '../types'

export interface IPortfolioAggregationProps<T = any> extends IBaseComponentProps {
  /**
   * Data source name
   */
  dataSource?: string

  /**
   * Category for data sources
   */
  dataSourceCategory?: string

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

  /**
   * Is the component used in a parent project or program
   */
  isParent?: boolean
}

export interface IPortfolioAggregationState {
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
   * Column context menu
   */
  columnContextMenu?: { column: IColumn; target: Target }

  /**
   * Column added timestamp
   */
  columnAdded?: number

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
  activeFilters?: { SelectedColumns?: string[];[key: string]: string[] }

  /**
   * Filters
   */
  filters?: IFilterProps[]
  
  /**
   * Views
   */
  views?: any[]
}
