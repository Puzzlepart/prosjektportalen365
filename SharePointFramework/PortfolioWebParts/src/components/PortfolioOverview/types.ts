import { IPortfolioConfiguration } from 'interfaces'
import {
  PortfolioOverviewView,
  ProjectColumn,
  ProjectColumnCustomSort
} from 'pp365-shared/lib/models'
import { IFilterProps } from '../FilterPanel'
import { IBaseComponentProps } from '../types'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { MessageBarType, IContextualMenuProps } from '@fluentui/react'

export class PortfolioOverviewErrorMessage extends Error {
  constructor(public message: string, public type: MessageBarType) {
    super(message)
  }
}

export interface IPortfolioOverviewProps extends IBaseComponentProps {
  /**
   * Configuration (columns and views etc).
   */
  configuration: IPortfolioConfiguration

  /**
   * SharePoint list name for the column configuration
   */
  columnConfigListName?: string

  /**
   * SharePoint list name for the column configuration
   */
  columnsListName?: string

  /**
   * SharePoint list name for the views configuration
   */
  viewsListName?: string

  /**
   * Number of status reports to show
   */
  statusReportsCount?: number

  /**
   * Show Excel export button
   */
  showExcelExportButton?: boolean

  /**
   * Show command bar
   */
  showCommandBar?: boolean

  /**
   * Show group by
   */
  showGroupBy?: boolean

  /**
   * Show search box
   */
  showSearchBox?: boolean

  /**
   * Show filters
   */
  showFilters?: boolean

  /**
   * Show view selector
   */
  showViewSelector?: boolean

  /**
   * Default view ID (the SharePoint item ID)
   */
  defaultViewId?: string

  /**
   * Is parent project. Set to `true` if the web part is used in a parent project.
   * This will fetch the child projects and show them in the list, instead of all
   * projects in the current hub site.
   */
  isParentProject?: boolean
}

export interface IPortfolioOverviewState {
  /**
   * Whether the component is loading
   */
  loading?: boolean

  /**
   * Is exporting
   */
  isExporting?: boolean

  /**
   * Is changing view
   */
  isChangingView?: PortfolioOverviewView

  /**
   * Items
   */
  items?: any[]

  /**
   * Selected items in the list
   */
  selectedItems?: any[]

  /**
   * Columns
   */
  columns?: ProjectColumn[]

  /**
   * Search term
   */
  searchTerm?: string

  /**
   * Filters
   */
  filters?: IFilterProps[]

  /**
   * Current view
   */
  currentView?: PortfolioOverviewView

  /**
   * Active filters
   */
  activeFilters?: { SelectedColumns?: string[]; [key: string]: string[] }

  /**
   * Error
   */
  error?: PortfolioOverviewErrorMessage

  /**
   * Show filter panel
   */
  showFilterPanel?: boolean

  /**
   * Column to group by
   */
  groupBy?: ProjectColumn

  /**
   * Column to sort by, and custom sort order if applicable
   */
  sortBy?: { column: ProjectColumn; customSort?: ProjectColumnCustomSort }

  /**
   * List should be rendered in compact mode
   */
  isCompact?: boolean

  /**
   * Program context used for web part context when used in a program project.
   */
  programContext?: WebPartContext

  /**
   * Props for column header context menu
   */
  columnContextMenu?: IContextualMenuProps
}

export interface IPortfolioOverviewHashStateState {
  /**
   * viewId found in hash (document.location.hash)
   */
  viewId?: string

  /**
   * groupBy found in hash (document.location.hash)
   */
  groupBy?: string
}
