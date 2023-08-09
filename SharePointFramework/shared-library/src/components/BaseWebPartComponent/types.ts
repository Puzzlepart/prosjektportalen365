import { IShimmerProps } from '@fluentui/react'
import { DisplayMode } from '@microsoft/sp-core-library'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SPFI } from '@pnp/sp'
import { CustomError } from '../../models'
import { DOMAttributes } from 'react'

export interface IBaseWebPartComponentProps extends DOMAttributes<HTMLDivElement> {
  /**
   * Title of the web part
   */
  title?: string

  /**
   * ID of the site
   */
  siteId?: string

  /**
   * URL for the web
   */
  webUrl?: string

  /**
   * Title for the web
   */
  webTitle?: string

  /**
   * Is the current user site admin
   */
  isSiteAdmin?: boolean

  /**
   * Display mode
   */
  displayMode?: DisplayMode

  /**
   * SPFx web part context
   */
  webPartContext?: WebPartContext

  /**
   * Configured SPFI instance
   */
  sp?: SPFI
}

export interface IBaseWebPartComponentState<T> extends Pick<IShimmerProps, 'isDataLoaded'> {
  /**
   * Data
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
