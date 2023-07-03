import { IColumn, MessageBarType, Target } from '@fluentui/react'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import strings from 'PortfolioWebPartsStrings'
import { IPortfolioConfiguration } from 'interfaces'
import { IFilterProps } from 'pp365-shared-library/lib/components/FilterPanel'
import {
  PortfolioOverviewView,
  ProjectColumn,
  ProjectColumnCustomSort
} from 'pp365-shared-library/lib/models'
import { IBaseComponentProps } from '../types'
import { IColumnFormPanel } from './ColumnFormPanel/types'
import { IEditViewColumnsPanel } from './EditViewColumnsPanel/types'
import styles from './PortfolioOverview.module.scss'

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
   * Edit view columns panel props.
   */
  editViewColumns?: IEditViewColumnsPanel
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

export const addColumn: IColumn = {
  key: 'AddColumn',
  fieldName: '',
  name: strings.AddColumnText,
  iconName: 'CalculatorAddition',
  iconClassName: styles.addColumnIcon,
  minWidth: 175
}
