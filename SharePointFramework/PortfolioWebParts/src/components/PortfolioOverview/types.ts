import { MessageBarType, Target } from '@fluentui/react'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { ProgramItem } from 'models/ProgramItem'
import { IFilterProps } from 'pp365-shared-library/lib/components/FilterPanel'
import {
  PortfolioOverviewView,
  ProjectColumn,
  ProjectColumnCustomSort
} from 'pp365-shared-library/lib/models'
import { IListProps } from '../List'
import { IBaseComponentProps } from '../types'
import { IColumnFormPanel } from './ColumnFormPanel/types'
import { IViewFormPanel } from './ViewFormPanel/types'
import { PortfolioInstance } from 'data/types'
import { IWeb } from '@pnp/sp/webs'

export class PortfolioOverviewErrorMessage extends Error {
  constructor(public message: string, public type: MessageBarType) {
    super(message)
  }
}

export interface IPortfolioOverviewConfiguration {
  /**
   * The web instance
   */
  web: IWeb

  /**
   * Available columns
   */
  columns: ProjectColumn[]

  /**
   * Available refiners
   */
  refiners: ProjectColumn[]

  /**
   * Available views
   */
  views: PortfolioOverviewView[]

  /**
   * Available programs that can be used to generate views for the portfolio overview
   */
  programs?: ProgramItem[]

  /**
   * New forms and edit forms urls for views list
   */
  viewsUrls: { defaultNewFormUrl: string; defaultEditFormUrl: string }

  /**
   * New form and edit form urls for columns list
   */
  columnUrls: { defaultNewFormUrl: string; defaultEditFormUrl: string }

  /**
   * Current user can add views (has `ADD_LIST_ITEMS` permission)
   */
  userCanAddViews?: boolean

  /**
   * Hub site ID
   */
  hubSiteId?: string
}

export interface IPortfolioOverviewProps
  extends IBaseComponentProps,
    Pick<IListProps<ProjectColumn>, 'isListLayoutModeJustified'> {
  /**
   * Configuration (columns and views etc).
   */
  configuration: IPortfolioOverviewConfiguration

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
   * Include view name in Excel export filename
   */
  includeViewNameInExcelExportFilename?: boolean

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
   * Show view selector where users can select view, create new views and edit views
   */
  showViewSelector?: boolean

  /**
   * Show program views. A dropdown is displayed in the command bar to select
   * a program view. The children projects of the selected program will be
   * displayed in the list.
   */
  showProgramViews?: boolean

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

  /**
   * Portfolio instances configured in the web part properties.
   */
  portfolios?: PortfolioInstance[]

  /**
   * The unique ID of the selected portfolio.
   */
  selectedPortfolioId?: string

  /**
   * Show portfolio selector in view mode (not just in web part properties).
   */
  showPortfolioSelector?: boolean

  /**
   * Callback to set the selected portfolio.
   *
   * @param portfolioId The unique ID of the selected portfolio.
   */
  onSetPortfolio?: (portfolioId: string) => void
}

export interface IPortfolioOverviewState
  extends Pick<IListProps<ProjectColumn>, 'items' | 'columns'> {
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
  isChangingView?: boolean

  /**
   * Selected items in the list
   */
  selectedItems?: Record<string, any>[]

  /**
   * Search term
   */
  searchTerm?: string

  /**
   * Filters
   */
  filters?: IFilterProps[]

  /**
   * Current view selected by the user in the view selector
   */
  currentView?: PortfolioOverviewView

  /**
   * Active filters for the current view
   */
  activeFilters?: { [key: string]: string[] }

  /**
   * Error if any
   */
  error?: PortfolioOverviewErrorMessage

  /**
   * Is filter panel open
   */
  isFilterPanelOpen?: boolean

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
   * Column context menu contains the `column` and `target` (mouse event target)
   * that is used to show the context menu in the correct position.
   */
  columnContextMenu?: { column: ProjectColumn; target: Target }

  /**
   * Column form panel props. Consists of two properties:
   * - `isOpen` - whether the panel is open
   * - `column` - the column to edit (if not specified, a new column will be created)
   */
  columnForm: IColumnFormPanel

  /**
   * View form panel props. Consists of two properties:
   * - `isOpen` - whether the panel is open
   * - `view` - the view to edit (if not specified, a new view will be created)
   */
  viewForm: IViewFormPanel

  /**
   * Is edit view columns panel open
   */
  isEditViewColumnsPanelOpen?: boolean

  /**
   * Available managed properties for the current search query
   */
  managedProperties?: string[]
}

export interface IPortfolioOverviewHashState {
  /**
   * viewId found in hash (document.location.hash)
   */
  viewId?: string

  /**
   * groupBy found in hash (document.location.hash)
   */
  groupBy?: string
}
