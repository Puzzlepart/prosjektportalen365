import { IButtonProps } from '@fluentui/react/lib/Button'
import { ProjectListModel } from 'models'

export interface IProjectCardProps {
  /**
   * Project model
   */
  project?: ProjectListModel

  /**
   * Should the title be truncated
   */
  shouldTruncateTitle?: boolean

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
   * Actions to display in the footer of the card
   */
  actions?: IButtonProps[]

  /**
   * Render a shimmered card (if data is loading)
   */
  shimmer?: boolean
}
