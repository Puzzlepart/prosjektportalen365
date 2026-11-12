import { IBaseComponentProps } from '../types'

/** Project-count limits and logo visibility for the latest-projects list. */
export interface ILatestProjectsProps extends IBaseComponentProps {
  /**
   * Projects shown before the list is expanded.
   */
  rowLimit: number

  /**
   * Lower bound used by the web part's row-limit slider.
   */
  minRowLimit?: number

  /**
   * Maximum sites fetched and upper bound of the row-limit slider.
   */
  maxRowLimit: number

  showProjectLogo?: boolean
}

/**
 * Represents the state of the LatestProjects component.
 */
export interface ILatestProjectsState {
  projects: any[]

  loading: boolean

  /**
   * Display all fetched projects instead of the initial `rowLimit`.
   */
  viewAll: boolean
}
