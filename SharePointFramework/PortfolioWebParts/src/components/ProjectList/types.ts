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

/**
 * Placeholder image used to projects not available to the user.
 */
export const placeholderImage =
  'data:image/jpeg;base64,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'
