import { IShimmerProps } from '@fluentui/react'
import { DisplayMode } from '@microsoft/sp-core-library'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SPFI } from '@pnp/sp'
import { HTMLProps } from 'react'
import { IHubSiteContext } from 'sp-hubsite-service'

export interface IBaseWebPartComponentProps extends Omit<HTMLProps<HTMLDivElement>, 'size'> {
  /**
   * Title of the web part
   */
  title?: string

  /**
   * Hub site context
   */
  hubSiteContext?: IHubSiteContext

  /**
   * Is the current user site admin
   */
  isSiteAdmin?: boolean

  /**
   * Display mode
   */
  displayMode?: DisplayMode

  /**
   * Web part context
   */
  spfxContext: WebPartContext

  /**
   * SPFI instance
   */
  sp: SPFI
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
