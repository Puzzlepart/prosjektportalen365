import { SearchResult } from '@pnp/sp'
import { DataAdapter } from 'data'
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
   * Placeholder text for searchbox
   */
  searchBoxPlaceholderText?: string

  /**
   * Show Excel export button
   */
  showExcelExportButton?: boolean

  /**
   * Locked columns
   */
  lockedColumns?: boolean

  /**
   * Data adapter
   */
  dataAdapter?: DataAdapter;

  /**
   * On update property
   */
  onUpdateProperty?: (key: string, value: any) => void

  /**
   * Transforms the data after it's fetched
   */
  postTransform?: (results: SearchResult[]) => T[]
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
  columns?: IColumn[]

  /**
   * Groups
   */
  groups?: IGroup[]

  /**
   * Column currently being edited
   */
  editColumn?: IColumn

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
  columnContextMenu?: { column: IColumn, target: Target }

  /**
   * Column added timestamp
   */
  columnAdded?: number

  /**
   * Error
   */
  error?: string
}
