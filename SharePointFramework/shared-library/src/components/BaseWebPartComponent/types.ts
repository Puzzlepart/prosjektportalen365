import { DisplayMode } from '@microsoft/sp-core-library'
import { SPFI } from '@pnp/sp'
import { DOMAttributes } from 'react'
import { CustomError, SiteContext } from '../../models'

export interface IBaseWebPartComponentProps extends DOMAttributes<HTMLDivElement>, SiteContext {
  /**
   * Title of the web part
   */
  title?: string

  /**
   * Description of the web part
   */
  description?: string

  /**
   * Display mode
   */
  displayMode?: DisplayMode

  /**
   * Configured SPFI instance
   */
  sp?: SPFI
}

export interface IBaseWebPartComponentState<T> {
  /**
   * Whether the component's data has finished loading. Named after the Fluent UI
   * v8 `Shimmer` prop it used to be picked from; the v9 `Skeleton` has no
   * equivalent, so it is declared here.
   */
  isDataLoaded?: boolean

  /**
   * Data for the component
   */
  data?: T

  /**
   * Error object
   */
  error?: CustomError

  /**
   * Is the component hidden
   */
  hidden?: boolean
}
