import { DisplayMode } from '@microsoft/sp-core-library'
import { PageContext } from '@microsoft/sp-page-context'
import { WebPartContext } from '@microsoft/sp-webpart-base'

/**
 * Provides shared web part metadata, contexts and a data adapter.
 */
export interface IBaseComponentProps<T> {
  title?: string

  webPartContext?: WebPartContext

  /**
   * SharePoint context for the page hosting the component.
   */
  pageContext?: PageContext

  /**
   * The solution-specific data adapter used by the component.
   */
  dataAdapter?: T

  displayMode?: DisplayMode
}
