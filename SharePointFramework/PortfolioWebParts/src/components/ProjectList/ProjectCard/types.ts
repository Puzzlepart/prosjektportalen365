import { IButtonProps } from 'office-ui-fabric-react/lib/Button'
import { ProjectListModel } from 'models'

export interface IProjectCardProps {
  /**
   * Project
   */
  project: ProjectListModel

  /**
   * Should the title be truncated
   */
  shouldTruncateTitle: boolean

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
   * Show Life Cycle Status
   */
  showLifeCycleStatus?: boolean

  /**
   * Actions
   */
  actions: IButtonProps[]
}
