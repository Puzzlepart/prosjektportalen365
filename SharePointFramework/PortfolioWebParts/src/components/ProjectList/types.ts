import { IShimmerProps } from '@fluentui/react'
import { IColumn } from '@fluentui/react/lib/DetailsList'
import { IBaseComponentProps } from '../types'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import { TabProps } from '@fluentui/react-components'
import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'

export interface IProjectListVertical extends Omit<TabProps, 'icon'> {
  /**
   * Text to display for the tab
   */
  text?: string

  /**
   * Icon to display for the tab
   */
  icon?: FluentIcon

  /**
   * Placeholder text for search box.
   */
  searchBoxPlaceholder?: string

  /**
   * Filter function for projects. If not provided, all projects are shown.
   *
   * @param project Project list model
   * @param state State of the component
   */
  filter?: (project: ProjectListModel, state: IProjectListState) => boolean

  /**
   * Function to determine if the vertical should be hidden. If not provided, the vertical is not hidden.
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
   * Show search box
   */
  showSearchBox?: boolean

  /**
   * Show render mode selector
   */
  showRenderModeSelector?: boolean

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
   * Default vertical
   */
  defaultVertical?: string

  /**
   * Array of verticals to hide
   */
  hideVerticals?: string[]

  /**
   * Vertical to show in the Tab component
   */
  verticals?: IProjectListVertical[]

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
   * Current selected vertical
   */
  selectedVertical?: IProjectListVertical

  /**
   * Is the current user in the PortfolioManagerGroup?
   */
  isUserInPortfolioManagerGroup?: boolean

  /**
   * Current sort
   */
  sort?: { fieldName: string; isSortedDescending: boolean }
}
