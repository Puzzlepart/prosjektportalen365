import { IColumn, IGroup, MessageBarType, Target } from '@fluentui/react'
import { SearchResult } from '@pnp/sp'
import { ProjectContentColumn } from 'pp365-shared-library'
import { IFilterProps } from 'pp365-shared-library/lib/components/FilterPanel'
import { DataSource } from 'pp365-shared-library/lib/models/DataSource'
import { IBaseComponentProps } from '../types'
import { IColumnFormPanel } from './ColumnFormPanel/types'

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

export interface IPortfolioAggregationProps<T = any> extends IBaseComponentProps {
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
   * Columns
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
   * Render list in justified layout mode. Manages which columns are visible, tries
   * to size them according to their min/max rules and drops  off columns that can't
   * fit and have isCollapsible set.
   */
  listLayoutModeJustified?: boolean

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
   * Items to show in the list
   */
  items?: any[]

  /**
   * Columns to be shown in the list
   */
  columns?: ProjectContentColumn[]

  /**
   * Columns for the selected data source or all columns available
   * for the data source category if no columns are defined
   * for the selected data source.
   */
  dataSourceColumns?: ProjectContentColumn[]

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
  columnContextMenu?: { column: ProjectContentColumn; target: Target }

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
