import { IShimmerProps } from '@fluentui/react'
import { ButtonProps } from '@fluentui/react-components'
import { IPortfolioAggregationProps } from 'components/PortfolioAggregation'
import { ProjectListModel } from 'pp365-shared-library'

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
   * Site ID to use for the project card
   */
  projectSiteId?: string
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
