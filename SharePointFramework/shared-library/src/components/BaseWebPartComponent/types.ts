import { IShimmerProps } from '@fluentui/react'
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
   * Display mode
   */
  displayMode?: DisplayMode

  /**
   * Configured SPFI instance
   */
  sp?: SPFI
}

export interface IBaseWebPartComponentState<T> extends Pick<IShimmerProps, 'isDataLoaded'> {
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
