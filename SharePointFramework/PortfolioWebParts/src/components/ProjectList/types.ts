import { IColumn } from '@fluentui/react/lib/DetailsList'
import { IBaseComponentProps } from '../types'
import { ProjectListModel } from 'models'

export interface IProjectListProps extends IBaseComponentProps {
  /**
   * Loading text
   */
  loadingText: string

  /**
   * Sort by property
   */
  sortBy?: string

  /**
   *Show search box
   */
  showSearchBox?: boolean

  /**
   * Show view selector
   */
  showViewSelector?: boolean

  /**
   * Show Project Logo
   */
  showProjectLogo?: boolean

  /**
   * Show Project Owner
   */
  showProjectOwner?: boolean

  /**
   * Show Project Manager
   */
  showProjectManager?: boolean

  /**
   * Columns
   */
  columns?: IColumn[]
}

export interface IProjectListState {
  /**
   * Whether the component is loading
   */
  loading: boolean

  /**
   * Search term
   */
  searchTerm: string

  /**
   * Projects
   */
  projects?: ProjectListModel[]

  /**
   * Error
   */
  error?: any

  /**
   * Show project info
   */
  showProjectInfo?: ProjectListModel

  /**
   * How the projects should be rendered. `tiles` or `list`
   */
  renderAs?: 'tiles' | 'list'

  /**
   * Current selected view
   */
  selectedView?: string

  /**
   * Is the current user in the PortfolioManagerGroup?
   */
  isUserInPortfolioManagerGroup?: boolean

  /**
   * Current sort
   */
  sort?: { fieldName: string; isSortedDescending: boolean }
}