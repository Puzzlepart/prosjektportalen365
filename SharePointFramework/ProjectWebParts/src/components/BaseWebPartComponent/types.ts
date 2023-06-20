import { IShimmerProps } from '@fluentui/react'
import { DisplayMode } from '@microsoft/sp-core-library'
import { WebPartContext } from '@microsoft/sp-webpart-base'

export interface IBaseWebPartComponentProps extends React.DOMAttributes<HTMLDivElement> {
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
}

export interface IBaseWebPartComponentState<T> extends Pick<IShimmerProps, 'isDataLoaded'> {
  /**
   * Data
   */
  data?: T

  /**
   * Error object
   */
  error?: any

  /**
   * Is the component hidden
   */
  hidden?: boolean
}
