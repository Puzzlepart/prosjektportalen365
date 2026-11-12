import { IBaseComponentProps } from '../types'
import { ProjectColumn, ProjectListModel } from 'pp365-shared-library/lib/models'
import { TabProps } from '@fluentui/react-components'
import { FluentIcon } from '@fluentui/react-icons/lib/utils/createFluentIcon'

/** A project-selection tab with filtering, visibility and search text. */
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
   */
  filter?: (project: ProjectListModel, state: IProjectListState) => boolean

  /**
   * Function to determine if the vertical should be hidden. If not provided, the vertical is not hidden.
   */
  isHidden?: (state: IProjectListState) => boolean
}

/** Value, label and icon for a project-list presentation mode. */
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
   * Icon to display for the render mode.
   */
  icon?: FluentIcon
}

/** Ordered relative destination in a project's quick-launch menu. */
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

/** Supported card and table presentations of projects. */
export type ProjectListRenderMode = 'tiles' | 'list' | 'compactList'

/**
 * Configuration for a single ProjectList vertical tab, stored as
 * a webpart property item in a `PropertyFieldCollectionData` collection.
 *
 * Filter logic works as follows:
 * - `fieldFilter` – JSON object matching raw SP item field values
 *   (e.g. `{"GtIsParentProject": true}`). Matched against `ProjectListModel.data`.
 *   A value may instead be an operator object to express something other than
 *   equality: `$ne` (not equal), `$in` (one of), `$nin` (none of) — e.g.
 *   `{"GtProjectPhaseText": {"$ne": "Avslutte"}}`.
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

/** Project-list tabs, sorting, card metadata and quick-launch configuration. */
export interface IProjectListProps extends IBaseComponentProps {
  sortBy?: string

  showSearchBox?: boolean

  /**
   * Include projects with completed or closed lifecycle status in the current UI language.
   * These are excluded by
   * default. When enabled they are loaded into state and it is up to each
   * vertical's filters to decide whether to show them, e.g.
   * `{"GtProjectLifecycleStatus": {"$nin": ["Avsluttet", "Closed"]}}` to keep a
   * tab free of them regardless of hub language.
   */
  showClosedProjects?: boolean

  showRenderModeSelector?: boolean

  showSortBy?: boolean

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

/** Loaded projects, active selection, search, sorting and information-panel state. */
export interface IProjectListState {
  /**
   * Whether the component's data has finished loading.
   */
  isDataLoaded?: boolean

  searchTerm: string

  projects?: ProjectListModel[]

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

  selectedVertical?: IProjectListVertical

  /**
   * Whether the current user can view the portfolio insight group's membership.
   */
  isUserInPortfolioManagerGroup?: boolean

  sort?: { fieldName: string; isSortedDescending: boolean }
}
