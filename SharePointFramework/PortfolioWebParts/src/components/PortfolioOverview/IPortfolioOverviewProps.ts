import { IPortfolioConfiguration } from 'interfaces'
import { IBaseComponentProps } from '../IBaseComponentProps'

export interface IPortfolioOverviewProps extends IBaseComponentProps {
  /**
   * Configuration (columns and views etc)
   */
  configuration: IPortfolioConfiguration

  /**
   * List name for column config
   */
  columnConfigListName: string

  /**
   * List name for columns
   */
  columnsListName: string

  /**
   * List name for views
   */
  viewsListName: string

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
   * Default view id
   */
  defaultViewId?: string
}
