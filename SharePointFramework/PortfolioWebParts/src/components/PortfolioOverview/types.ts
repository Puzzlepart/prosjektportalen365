import { WebPartContext } from '@microsoft/sp-webpart-base'
import { ProgramItem } from 'models/ProgramItem'
import { IFilterProps } from 'pp365-shared-library/lib/components/FilterPanel'
import {
  PortfolioOverviewView,
  ProjectColumn,
  ProjectColumnCustomSort
} from 'pp365-shared-library/lib/models'
import { IListProps, ResizeColumn } from '../List'
import { IBaseComponentProps } from '../types'
import { IColumnFormPanel } from './ColumnFormPanel/types'
import { IViewFormPanel } from './ViewFormPanel/types'
import { PortfolioInstance } from 'data/types'
import { IWeb } from '@pnp/sp/webs'
import { MessageBarProps } from '@fluentui/react-components'

/** An overview failure with its intended message-bar severity. */
export class PortfolioOverviewErrorMessage extends Error {
  constructor(
    public message: string,
    public type: MessageBarProps['intent']
  ) {
    super(message)
  }
}

/** Portfolio columns, views, programs, form URLs and editing permissions. */
export interface IPortfolioOverviewConfiguration {
  web: IWeb

  columns: ProjectColumn[]

  refiners: ProjectColumn[]

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

  hubSiteId?: string
}

/** Portfolio data source, display controls and multi-hub selection options. */
export interface IPortfolioOverviewProps
  extends IBaseComponentProps, Pick<IListProps<ProjectColumn>, 'isListLayoutModeJustified'> {
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

  showExcelExportButton?: boolean

  includeViewNameInExcelExportFilename?: boolean

  showCommandBar?: boolean

  showSearchBox?: boolean

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
   * Enable merged view to show data from all configured portfolios simultaneously.
   * When enabled, data from all portfolios is combined using the first portfolio as primary.
   */
  showMergedView?: boolean

  /**
   * Show merged view option in the view selector dropdown.
   * When enabled, adds a "Merged View" option to the views menu that shows data from all hubs.
   */
  showMergedViewInViewSelector?: boolean

  /**
   * Callback to set the selected portfolio.
   *
   * @param portfolioId The unique ID of the selected portfolio, or null for merged view.
   */
  onSetPortfolio?: (portfolioId: string | null) => void
}

/** View data, filtering, sorting, selection and editing-panel state. */
export interface IPortfolioOverviewState extends Pick<
  IListProps<ProjectColumn>,
  'items' | 'columns'
> {
  loading?: boolean

  isExporting?: boolean

  /**
   * Is merged view active (showing data from all portfolios)
   */
  isMergedView?: boolean

  isChangingView?: boolean

  selectedItems?: Record<string, any>[]

  searchTerm?: string

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
   * The titles of the hubs the merged view could not read, told above the list.
   */
  mergedViewFailures?: string[]

  error?: PortfolioOverviewErrorMessage

  isFilterPanelOpen?: boolean

  groupBy?: ProjectColumn

  /**
   * Column to sort by, and custom sort order if applicable
   */
  sortBy?: { column: ProjectColumn; customSort?: ProjectColumnCustomSort }

  isCompact?: boolean

  /**
   * Program context used for web part context when used in a program project.
   */
  programContext?: WebPartContext

  /**
   * Column context menu contains the `column` and `target` (mouse event target)
   * that is used to show the context menu in the correct position, and a way to
   * change the column's width from the keyboard.
   */
  columnContextMenu?: { column: ProjectColumn; target: HTMLElement; resizeColumn?: ResizeColumn }

  /**
   * Column form panel props. Consists of two properties:
   * - `isOpen` - whether the panel is open
   * - `column` - the column to edit (if not specified, a new column will be created)
   */
  columnForm: IColumnFormPanel

  /**
   * Ids of the columns deleted since the configuration was read, which still lists them
   */
  deletedColumnIds?: number[]

  /**
   * View form panel props. Consists of two properties:
   * - `isOpen` - whether the panel is open
   * - `view` - the view to edit (if not specified, a new view will be created)
   */
  viewForm: IViewFormPanel

  isEditViewColumnsPanelOpen?: boolean

  /**
   * Available managed properties for the current search query
   */
  managedProperties?: string[]

  /**
   * Whether the current user can view the Portfolio Insight site group's membership.
   * When true, the project information panel button is shown in `TitleColumn`
   * even for projects where the user has no site access.
   */
  isUserInPortfolioManagerGroup?: boolean

  /**
   * Value of the global setting `ShowChildProjectInfoInProgram`.
   * When true and `isParentProject` is set, the project information panel
   * button is shown in `TitleColumn` for all child projects of a program —
   * including those the user has no site access to.
   */
  showChildProjectInfoInProgram?: boolean
}

/** View and grouping selection persisted in the URL fragment. */
export interface IPortfolioOverviewHashState {
  viewId?: string

  groupBy?: string
}
