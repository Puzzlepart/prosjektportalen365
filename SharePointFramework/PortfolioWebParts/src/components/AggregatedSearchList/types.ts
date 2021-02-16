import { SearchResult } from '@pnp/sp'
import { IAggregatedSearchListColumn } from 'interfaces'
import { IContextualMenuProps } from 'office-ui-fabric-react/lib/ContextualMenu'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { DataSource } from 'pp365-shared/lib/models/DataSource'
import { IBaseComponentProps } from '../IBaseComponentProps'

export interface IAggregatedSearchListProps extends IBaseComponentProps {
  /**
   * Class name
   */
  className?: string

  /**
   * Data source name
   */
  dataSource?: string

  /**
   * Category for data sources
   */
  dataSourceCategory?: string

  /**
   * Query template
   */
  queryTemplate?: string

  /**
   * Transforms the data after it's fetched
   */
  postTransform?: (results: SearchResult[]) => any[]

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
   * Text to show when loading
   */
  loadingText?: string

  /**
   * Placeholder text for searchbox
   */
  searchBoxPlaceholderText?: string

  /**
   * Show Excel export button
   */
  showExcelExportButton?: boolean

  /**
   * Columns to show in the DetailsList
   */
  columns?: IAggregatedSearchListColumn[]
}


export interface IAggregatedSearchListState {
  /**
   * Whether the component is loading
   */
  loading: boolean

  /**
   * Whether there's an export in progress
   */
  isExporting?: boolean

  /**
   * Items to show in the details list
   */
  items?: any[]

  /**
   * Selected data source
   */
  selectedDataSource?: DataSource

  /**
   * Available data sources
   */
  dataSources?: DataSource[]

  /**
   * Columns to show in the DetailsList
   */
  columns: IColumn[]

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
  error?: string

  /**
   * Props for column header context menu
   */
  columnContextMenu?: IContextualMenuProps
}
