import { IButtonProps } from '@fluentui/react/lib/Button'
import { ProjectListModel } from 'models'
import { IProjectListProps } from '../types'

export interface IProjectCardProps
  extends Pick<IProjectListProps, 'showProjectLogo' | 'showProjectOwner' | 'showProjectManager'> {
  /**
   * Project model
   */
  project?: ProjectListModel

  /**
   * Should the title be truncated
   */
  shouldTruncateTitle?: boolean

  /**
   * Actions to display in the footer of the card
   */
  actions?: IButtonProps[]

  /**
   * Controls when the shimmer is swapped with actual data through an animated transition
   */
  isDataLoaded?: boolean
}
