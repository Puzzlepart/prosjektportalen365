import { IColumn, IGroup, MessageBarType } from '@fluentui/react'
import { SearchResult } from '@pnp/sp'
import { ProjectContentColumn } from 'pp365-shared-library'
import { IFilterProps } from 'pp365-shared-library/lib/components/FilterPanel'
import { DataSource } from 'pp365-shared-library/lib/models/DataSource'
import { IListProps, OnColumnContextMenu } from '../List'
import { IBaseComponentProps } from '../types'
import { IColumnFormPanel } from './ColumnFormPanel/types'
import { IViewFormPanel } from './ViewFormPanel/types'

export class PortfolioAggregationErrorMessage extends Error {
  constructor(public message: string, public type: MessageBarType) {
    super(message)
  }
}

export interface IPortfolioAggregationConfiguration {
  viewsUrls: { defaultNewFormUrl: string; defaultEditFormUrl: string }
  columnUrls: { defaultNewFormUrl: string; defaultEditFormUrl: string }
  views?: DataSource[]
  level?: string
  levels?: string[]
}

export interface IPortfolioAggregationProps<T = any>
  extends IBaseComponentProps,
    Pick<IListProps, 'isListLayoutModeJustified'> {
  /**
   * Configuration (columns and views etc)
   */
  configuration?: IPortfolioAggregationConfiguration

  /**
   * Name of the currently selected data source (also called view)
   */
  dataSource?: string

  /**
   * Category for data sources (also called views)
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
   * Columns selected for the current view
   */
  columns?: ProjectContentColumn[]

  /**
   * Select properties
   */
  selectProperties?: string[]

  /**
   * Show command bar
   */
  showCommandBar?: boolean

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

  /**
   * Transforms the data after it's fetched
   */
  postTransform?: (results: SearchResult[]) => T[]

  /**
   * Is parent project. Set to `true` if the web part is used in a parent project.
   * For now the Add column button is hidden if this is set to `true`.
   */
  isParentProject?: boolean
}

export interface IPortfolioAggregationState
  extends Pick<IPortfolioAggregationProps, 'dataSource' | 'dataSourceLevel' | 'columns'> {
  /**
   * `true` if the component is loading data. The list will be
   * rendered with shimmer placeholders if the component is loading.
   */
  loading?: boolean

  /**
   * `true` if the component is exporting to Excel
   */
  isExporting?: boolean

  /**
   * Data sources
   */
  dataSources?: DataSource[]

  /**
   * Items to show in the list
   */
  items?: any[]

  /**
   * All columns available for the data source category. Property `data.isSelected` is
   * set to `true`for all columns that are selected for the current view
   * in property `columns`.
   */
  allColumnsForCategory?: ProjectContentColumn[]

  /**
   * Groups to be rendered in the list
   */
  groups?: IGroup[]

  /**
   * Column to group by in the list
   */
  groupBy?: IColumn

  /**
   * Column to sort by in the list
   */
  sortBy?: IColumn

  /**
   * Initial search term that should be
   * set to a blank string initially
   * in `getInitialState()` for the
   * reducer.
   */
  searchTerm?: string

  /**
   * Column form panel properties
   */
  columnForm?: IColumnFormPanel

  /**
   * Is edit view columns panel open
   */
  isEditViewColumnsPanelOpen?: boolean

  /**
   * Column context menu
   */
  columnContextMenu?: OnColumnContextMenu

  /**
   * Timestamp for when a new column was added or updated
   */
  columnAddedOrUpdated?: number

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
   * Is filter panel open
   */
  isFilterPanelOpen?: boolean

  /**
   * Is compact
   */
  isCompact?: boolean

  /**
   * Active filters
   */
  activeFilters?: Record<string, string[]>

  /**
   * Filters
   */
  filters?: IFilterProps[]

  /**
   * Current view
   */
  currentView?: DataSource

  /**
   * View form panel props. Consists of two properties:
   * - `isOpen` - whether the panel is open
   * - `view` - the view (data source) to edit (if not specified, a new view will be created)
   */
  viewForm: IViewFormPanel
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
