import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { IBaseComponentProps } from '../types'
import { ProjectListModel } from 'models'

export interface IProjectListProps extends IBaseComponentProps {
  /**
   * Loading text
   */
  loadingText: string

  /**
   * Seach box placeholder text
   */
  searchBoxPlaceholderText: string

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
   * Show as tiles (shown as list if false)
   */
  showAsTiles?: boolean

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

  /**
   * Display all projects
   */
  showAllProjects?: boolean
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
   * Show as tiles (shown as list if false)
   */
  showAsTiles?: boolean

  /**
   * List view properties
   */
  listView?: { projects: ProjectListModel[]; columns: IColumn[] }

  /**
   * Show all projects from web part properties
   */
  showAllProjects?: boolean

  /**
   * Only display projects that the user have access to
   */
  onlyAccessProjects?: boolean

  /**
   * Is the current user in the PortfolioManagerGroup?
   */
  isUserInPortfolioManagerGroup?: boolean
}
