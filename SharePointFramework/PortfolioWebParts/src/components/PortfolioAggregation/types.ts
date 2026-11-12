import { ProjectColumn, ProjectContentColumn } from 'pp365-shared-library'
import { IFilterProps } from 'pp365-shared-library/lib/components/FilterPanel'
import { DataSource } from 'pp365-shared-library/lib/models/DataSource'
import { IListProps, OnColumnContextMenu } from '../List'
import { IBaseComponentProps } from '../types'
import { IColumnFormPanel } from './ColumnFormPanel/types'
import { IViewFormPanel } from './ViewFormPanel/types'
import { ISearchResult } from '@pnp/sp/search'
import { MessageBarProps } from '@fluentui/react-components'

/** An aggregation failure with its intended message-bar severity. */
export class PortfolioAggregationErrorMessage extends Error {
  constructor(
    public message: string,
    public type: MessageBarProps['intent']
  ) {
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
    defaultNewFormUrl: string

    defaultEditFormUrl: string
  }

  /**
   * URLs for the default new and edit forms for the columns.
   */
  columnUrls: {
    defaultNewFormUrl: string

    defaultEditFormUrl: string
  }

  /**
   * Available content columns for the category.
   */
  columns?: ProjectContentColumn[]

  /**
   * Data-source views for the category.
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

  /**
   * Refinable project columns from Prosjektkolonner (`GtIsRefinable=true`).
   * Surfaced as filters under a "Project information" group, independent of
   * the DataSource's own `refiners`.
   */
  refiners?: ProjectColumn[]
}

/** Aggregation source, columns, display controls and optional result transformation. */
export interface IPortfolioAggregationProps<T = any>
  extends IBaseComponentProps, Pick<IListProps, 'isListLayoutModeJustified' | 'hiddenColumns'> {
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

  selectProperties?: string[]

  showCommandBar?: boolean

  showFilters?: boolean

  searchBoxPlaceholderText?: string

  showExcelExportButton?: boolean

  showViewSelector?: boolean

  /**
   * Default view id (the SharePoint item ID)
   */
  defaultViewId?: string

  /**
   * Prevent column editing and hide the synthetic add-column header.
   */
  lockedColumns?: boolean

  /**
   * Persist changed column selection to the hosting web part.
   */
  onUpdateProperty?: (key: string, value: any) => void

  /**
   * Transforms the data after it's fetched
   */
  postTransform?: (results: ISearchResult[]) => T[]

  /**
   * Whether the web part is hosted in a parent project.
   */
  isParentProject?: boolean
}

/** Aggregated rows, active source, filters, selected columns and editing state. */
export interface IPortfolioAggregationState extends Pick<
  IPortfolioAggregationProps,
  'dataSourceLevel' | 'dataSourceCategory' | 'columns'
> {
  /**
   * `true` if the component is loading data. The list will be
   * rendered with shimmer placeholders if the component is loading.
   */
  loading?: boolean

  isExporting?: boolean

  isChangingView?: boolean

  /**
   * Views available for the data source category.
   */
  views?: DataSource[]

  items?: any[]

  selectedItems?: any[]

  /**
   * All columns available for the data source category. Property `data.isSelected` is
   * set to `true` for all columns that are selected for the current view
   * in property `columns`.
   */
  allColumnsForCategory?: ProjectContentColumn[]

  groupBy?: ProjectContentColumn

  sortBy?: ProjectContentColumn

  searchTerm?: string

  columnForm?: IColumnFormPanel

  isEditViewColumnsPanelOpen?: boolean

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
   * Ids of the columns deleted since the configuration was read, which still lists them
   */
  deletedColumnIds?: number[]

  /**
   * Column shown/hidden timestamp
   */
  columnShowHide?: number

  error?: Error

  isFilterPanelOpen?: boolean

  isCompact?: boolean

  activeFilters?: Record<string, string[]>

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

/** View and grouping selection persisted in the URL fragment. */
export interface IPortfolioAggregationHashState {
  viewId?: string

  groupBy?: string
}
