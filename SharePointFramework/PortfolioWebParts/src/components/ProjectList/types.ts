import { IShimmerProps } from '@fluentui/react'
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

export interface IRenderMode {
  /**
   * Value of the render mode
   */
  value?: string

  /**
   * Text to display for the render mode
   */
  text?: string

  /**
   * Icon to display for therender mode
   */
  icon?: FluentIcon
}

export interface IQuickLaunch {
  /**
   * Order of the menu item
   */
  order?: number

  /**
   * Title for the menu item
   */
  text?: string

  /**
   * relative url to navigate to
   */
  relativeUrl?: string
}

export type ProjectListRenderMode = 'tiles' | 'list' | 'compactList'

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
   * Show sort by button
   */
  showSortBy?: boolean

  /**
   * Show Project Logo on the project card
   */
  showProjectLogo?: boolean

  /**
   * Project metadata to show on the project card
   */
  projectMetadata?: string[]

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

  /**
   * Use dynamic colors for the project card
   */
  useDynamicColors?: boolean

  /**
   * Quick launch menu (List experience only)
   */
  quickLaunchMenu?: IQuickLaunch[]
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
   * Current selected render mode
   */
  selectedRenderMode?: IRenderMode

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
