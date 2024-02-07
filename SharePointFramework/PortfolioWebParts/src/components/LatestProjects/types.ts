import { IBaseComponentProps } from '../types'

export interface ILatestProjectsProps extends IBaseComponentProps {
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

  /**
   * Show project logo for each project
   */
  showProjectLogo?: boolean
}

/**
 * Represents the state of the LatestProjects component.
 */
export interface ILatestProjectsState {
  /**
   * An array of project objects.
   */
  projects: any[]

  /**
   * A boolean indicating whether the component is currently loading data.
   */
  loading: boolean

  /**
   * A boolean indicating whether to display all projects or just a subset (`props.rowLimit`)
   */
  viewAll: boolean
}
