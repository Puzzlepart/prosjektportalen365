import { DisplayMode } from '@microsoft/sp-core-library'
import { SPFI } from '@pnp/sp'
import { DOMAttributes } from 'react'
import { CustomError, SiteContext } from '../../models'

/**
 * Provides web part metadata and SharePoint context to class components.
 */
export interface IBaseWebPartComponentProps extends DOMAttributes<HTMLDivElement>, SiteContext {
  title?: string

  description?: string

  displayMode?: DisplayMode

  sp?: SPFI
}

/**
 * Tracks a class web part component's data, loading and error state.
 */
export interface IBaseWebPartComponentState<T> {
  /**
   * Whether the component's data has finished loading. Named after the Fluent UI
   * v8 `Shimmer` prop it used to be picked from; the v9 `Skeleton` has no
   * equivalent, so it is declared here.
   */
  isDataLoaded?: boolean

  data?: T

  error?: CustomError

  hidden?: boolean
}
