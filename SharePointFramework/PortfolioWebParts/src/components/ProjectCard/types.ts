import { IShimmerProps } from '@fluentui/react'
import { ButtonProps } from '@fluentui/react-components'
import { IPortfolioAggregationProps } from 'components/PortfolioAggregation'
import { ProjectColumn, ProjectListModel } from 'pp365-shared-library'
import { IHubContext } from '../../data/types'

export interface IProjectCardProps extends IPortfolioAggregationProps {
  /**
   * Actions to display in the footer of the card
   */
  actions?: ButtonProps[]

  /**
   * Controls when the shimmer is swapped with actual data through an animated transition
   */
  isDataLoaded?: boolean

  /**
   * Checks if the metadata with the given key should be displayed
   */
  shouldDisplay?: (key: string) => boolean

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
   * Show Project Logo on the project card
   */
  showProjectLogo?: boolean

  /**
   * Use dynamic colors for the project card
   */
  useDynamicColors?: boolean

  /**
   * Quick launch menu (List experience only)
   */
  quickLaunchMenu?: IQuickLaunch[]

  /**
   * Site ID to use for the project card
   */
  projectSiteId?: string

  /**
   * Hub context for cross-hub data access
   */
  hubContext?: IHubContext
}

export interface IProjectCardState extends Pick<IShimmerProps, 'isDataLoaded'> {
  loading?: boolean
  refetch?: number

  /**
   * Project model
   */
  project?: ProjectListModel

  /**
   * The current project to show project information for using the
   * `ProjectInformationPanel` from `pp365-projectwebparts`. If not provided,
   * the panel is not shown. This is set to `null` or `undefined` to hide
   * the panel.
   */
  showProjectInfo?: ProjectListModel
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
