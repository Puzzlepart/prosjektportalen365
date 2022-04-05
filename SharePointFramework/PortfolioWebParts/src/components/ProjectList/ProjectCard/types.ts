import { IButtonProps } from 'office-ui-fabric-react/lib/Button'
import { ProjectListModel } from 'models'

export interface IProjectCardProps {
  /**
   * Project
   */
  project: ProjectListModel

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
   * Show Service Area
   */
  showServiceArea?: boolean

  /**
   * Show Type
   */
  showType?: boolean

  /**
   * Actions
   */
  actions: IButtonProps[]

  /**
   * Phase Level (Portfolio, Project)
   */
  phaseLevel: string
}
