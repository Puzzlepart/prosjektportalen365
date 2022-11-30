import { IButtonProps, IPivotItemProps, IShimmerProps } from '@fluentui/react'
import { IColumn } from '@fluentui/react/lib/DetailsList'
import { ProjectListModel } from 'models'
import { IBaseComponentProps } from '../types'

export interface IProjectListView extends IPivotItemProps {
  searchBoxPlaceholder?: string
  filter?: (project?: ProjectListModel) => boolean
  getHeaderButtonProps?: (
    state: IProjectListState
  ) =>
    | IButtonProps
    | {
        [key: string]: string | number | boolean
      }
}

export type ProjectListRenderMode = 'tiles' | 'list'

export interface IProjectListProps extends IBaseComponentProps {
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

  /**
   * Default view
   */
  defaultView?: string

  /**
   * Hide views
   */
  hideViews?: string[]
}

export interface IProjectListState extends Pick<IShimmerProps, 'isDataLoaded'> {
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
  renderAs?: ProjectListRenderMode
  /**
   * Current selected view
   */
  selectedView?: IProjectListView

  /**
   * Is the current user in the PortfolioManagerGroup?
   */
  isUserInPortfolioManagerGroup?: boolean

  /**
   * Current sort
   */
  sort?: { fieldName: string; isSortedDescending: boolean }
}
