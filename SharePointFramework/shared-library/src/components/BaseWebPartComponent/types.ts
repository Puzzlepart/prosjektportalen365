import { IShimmerProps } from '@fluentui/react'
import { DisplayMode } from '@microsoft/sp-core-library'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SPFI } from '@pnp/sp'
import { CustomError } from '../../models'
import { DOMAttributes } from 'react'
import { PageContext } from '@microsoft/sp-page-context'

export interface IBaseWebPartComponentProps extends DOMAttributes<HTMLDivElement> {
  /**
   * Title of the web part
   */
  title?: string

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
   * SPFx page context
   */
  pageContext?: PageContext

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
