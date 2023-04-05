import { IButtonProps, IPivotItemProps, IShimmerProps } from '@fluentui/react'
import { IColumn } from '@fluentui/react/lib/DetailsList'
import { ProjectListModel } from 'models'
import { IBaseComponentProps } from '../types'

export interface IProjectListView extends IPivotItemProps {
  /**
   * Placeholder text for search box.
   */
  searchBoxPlaceholder?: string

  /**
   * Filter function for projects. If not provided, all projects are shown.
   *
   * @param project Project list model
   */
  filter?: (project?: ProjectListModel) => boolean

  /**
   * Function to get header button props. If not provided, the default button props are used.
   *
   * @param state State of the component
   */
  getHeaderButtonProps?: (
    state: IProjectListState
  ) =>
    | IButtonProps
    | {
        [key: string]: string | number | boolean
      }

  /**
   * Function to determine if the view should be hidden. If not provided, the view is not hidden.
   *
   * @param state State of the component
   */
  isHidden?: (state: IProjectListState) => boolean
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
   * Show Project Logo on the project card
   */
  showProjectLogo?: boolean

  /**
   * Show Project Owner on the project card
   */
  showProjectOwner?: boolean

  /**
   * Show Project Manager on the project card
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
   * Array of views to hide
   */
  hideViews?: string[]

  /**
   * Views to show using Pivot component
   */
  views?: IProjectListView[]

  /**
   * Default render mode
   */
  defaultRenderMode?: ProjectListRenderMode
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
  renderMode?: ProjectListRenderMode
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
