import { SearchResult } from '@pnp/sp'
import { IBaseComponentProps } from '../IBaseComponentProps'
import { IAggregatedSearchListColumn } from 'interfaces'

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
