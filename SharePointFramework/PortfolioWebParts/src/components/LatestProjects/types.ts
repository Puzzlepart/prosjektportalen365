import { IBaseComponentProps } from '../types'

export interface ILatestProjectsProps extends IBaseComponentProps {
  /**
   * Show Project Logo
   */
  showProjectLogo?: boolean

  /**
   * Number of projects to show
   */
  rowLimit: number

  /**
   * Min number of projects to show
   */
  minRowLimit?: number

  /**
   * Max number of projects to show
   */
  maxRowLimit: number
}
