import { IBaseComponentProps } from '../types'

export interface ILatestProjectsProps extends IBaseComponentProps {
  /**
   * Loading text
   */
  loadingText: string

  /**
   * Empty message
   */
  emptyMessage: string

  /**
   * Number of items to show
   */
  rowLimit: number

  /**
   * Min number of items to show
   */
  minRowLimit?: number

  /**
   * Max number of items to show
   */
  maxRowLimit: number

  /**
   * Open project sites in a new tab
   */
  openInNewTab: boolean
}
