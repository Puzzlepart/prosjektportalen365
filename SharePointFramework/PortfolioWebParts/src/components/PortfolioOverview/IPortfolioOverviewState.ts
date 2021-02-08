import { IContextualMenuProps } from 'office-ui-fabric-react/lib/ContextualMenu'
import { PortfolioOverviewView, ProjectColumn } from 'pp365-shared/lib/models'
import { IFilterProps } from '../FilterPanel'
import { PortfolioOverviewErrorMessage } from './PortfolioOverviewErrorMessage'

export interface IPortfolioOverviewState {
  /**
   * Whether the component is loading
   */
  isLoading?: boolean

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
   * @todo describe property
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
   * Column to sort by
   */
  sortBy?: ProjectColumn

  /**
   * Show project info
   */
  showProjectInfo?: any

  /**
   * Is compact
   */
  isCompact?: boolean

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
