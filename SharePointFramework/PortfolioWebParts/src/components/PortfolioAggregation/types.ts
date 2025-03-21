import { IGroup, MessageBarType } from '@fluentui/react'
import { ProjectContentColumn } from 'pp365-shared-library'
import { IFilterProps } from 'pp365-shared-library/lib/components/FilterPanel'
import { DataSource } from 'pp365-shared-library/lib/models/DataSource'
import { IListProps, OnColumnContextMenu } from '../List'
import { IBaseComponentProps } from '../types'
import { IColumnFormPanel } from './ColumnFormPanel/types'
import { IViewFormPanel } from './ViewFormPanel/types'
import { ISearchResult } from '@pnp/sp/search'

export class PortfolioAggregationErrorMessage extends Error {
  constructor(public message: string, public type: MessageBarType) {
    super(message)
  }
}

/**
 * Represents the configuration for the Portfolio Aggregation web part.
 */
export interface IPortfolioAggregationConfiguration {
  /**
   * URLs for the default new and edit forms for the views.
   */
  viewsUrls: {
    /**
     * URL for the default new form for the views.
     */
    defaultNewFormUrl: string

    /**
     * URL for the default edit form for the views.
     */
    defaultEditFormUrl: string
  }

  /**
   * URLs for the default new and edit forms for the columns.
   */
  columnUrls: {
    /**
     * URL for the default new form for the columns.
     */
    defaultNewFormUrl: string

    /**
     * URL for the default edit form for the columns.
     */
    defaultEditFormUrl: string
  }

  /**
   * An array of ProjectContentColumn objects representing the columns to display in the web part.
   */
  columns?: ProjectContentColumn[]

  /**
   * An array of DataSource objects representing the views to display in the web part.
   */
  views?: DataSource[]

  /**
   * The level of the data to display in the web part.
   */
  level?: string

  /**
   * An array of strings representing the levels of data to display in the web part.
   */
  levels?: string[]
}

export interface IPortfolioAggregationConfiguration {
  viewsUrls: { defaultNewFormUrl: string; defaultEditFormUrl: string }
  columnUrls: { defaultNewFormUrl: string; defaultEditFormUrl: string }
  columns?: ProjectContentColumn[]
  views?: DataSource[]
  level?: string
  levels?: string[]
}

export interface IPortfolioAggregationProps<T = any>
  extends IBaseComponentProps,
    Pick<IListProps, 'isListLayoutModeJustified' | 'hiddenColumns'> {
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
   * Show Excel export button. If set to `true`, the Excel
   * export button will be shown in the command bar.
   */
  showExcelExportButton?: boolean

  /**
   * Show view selector. If set to `true`, the view selector
   * will be shown in the command bar.
   */
  showViewSelector?: boolean

  /**
   * Default view id (the SharePoint item ID)
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
  postTransform?: (results: ISearchResult[]) => T[]

  /**
   * Is parent project. Set to `true` if the web part is used in a parent project.
   * For now the Add column button is hidden if this is set to `true`.
   */
  isParentProject?: boolean
}

export interface IPortfolioAggregationState
  extends Pick<IPortfolioAggregationProps, 'dataSourceLevel' | 'dataSourceCategory' | 'columns'> {
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
   * Is changing view
   */
  isChangingView?: boolean

  /**
   * Views available for the data source category.
   */
  views?: DataSource[]

  /**
   * Items to show in the list
   */
  items?: any[]

  /**
   * Selected items in the list
   */
  selectedItems?: any[]

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
  groupBy?: ProjectContentColumn

  /**
   * Column to sort by in the list
   */
  sortBy?: ProjectContentColumn

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
   * Current view (or data source) selected in the view selector.
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
