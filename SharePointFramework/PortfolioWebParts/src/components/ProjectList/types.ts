import { IShimmerProps } from '@fluentui/react'
import { IBaseComponentProps } from '../types'
import { ProjectColumn, ProjectListModel } from 'pp365-shared-library/lib/models'
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

/**
 * Configuration for a single ProjectList vertical tab, stored as
 * a webpart property item in a `PropertyFieldCollectionData` collection.
 *
 * Filter logic works as follows:
 * - `fieldFilter` – JSON object matching raw SP item field values
 *   (e.g. `{"GtIsParentProject": true}`). Matched against `ProjectListModel.data`.
 * - `clientFilter` – JSON object matching computed `ProjectListModel`
 *   properties (e.g. `{"hasUserAccess": true}`, `{"isUserMember": true}`).
 * - `visibilityRule` – JSON object matching `IProjectListState` properties
 *   (e.g. `{"isUserInPortfolioManagerGroup": true}`). Hides the tab when unmet.
 * - `requiresAccess` – project passes if user is portfolio manager OR has access.
 */
export interface IVerticalConfig {
  title: string
  iconName: string
  clientFilter: string
  fieldFilter: string
  visibilityRule: string
  requiresAccess: boolean
  isDefault: boolean
  searchBoxPlaceholder: string
}

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
   * Project column configuration
   */
  projectColumns?: ProjectColumn[]

  /**
   * Primary field to show on the project card
   */
  primaryField?: string

  /**
   * Secondary field to show on the project card
   */
  secondaryField?: string

  /**
   * Primary userfield to show on the project card footer.
   */
  primaryUserField?: string

  /**
   * Secondary userfield to show on the project card footer.
   */
  secondaryUserField?: string

  /**
   * Project metadata to show on the project card
   */
  projectMetadata?: string[]

  /**
   * Vertical configurations from webpart property pane.
   * Each entry defines a tab with optional filter/visibility logic.
   */
  verticalConfigs?: IVerticalConfig[]

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
   * The current project to show project information for using the
   * `ProjectInformationPanel` from `pp365-projectwebparts`. If not provided,
   * the panel is not shown. This is set to `null` or `undefined` to hide
   * the panel.
   */
  showProjectInfo?: ProjectListModel

  /**
   * How the projects should be rendered. The available options are:
   * - `tiles`: Render projects as tiles
   * - `list`: Render projects as a list
   * - `compactList`: Render projects as a compact list
   */
  renderMode?: ProjectListRenderMode

  /**
   * Available verticals (built from webpart property configurations)
   */
  verticals?: IProjectListVertical[]

  /**
   * Current selected vertical
   */
  selectedVertical?: IProjectListVertical

  /**
   * Is the current user in the `PortfolioManagerGroup`?
   */
  isUserInPortfolioManagerGroup?: boolean

  /**
   * Current sort
   */
  sort?: { fieldName: string; isSortedDescending: boolean }
}
