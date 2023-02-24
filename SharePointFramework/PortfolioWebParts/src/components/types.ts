import { DisplayMode } from '@microsoft/sp-core-library'
import { PageContext } from '@microsoft/sp-page-context'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { IDataAdapter } from 'data/types'

export interface IBaseComponentProps {
  /**
   * Component title.
   */
  title?: string

  /**
   * Web part context
   */
  webPartContext?: WebPartContext

  /**
   * Page context. It might be neccessary to pass `this.context.pageContext as any` due to
   * mismatch in version of `@microsoft/sp-page-context`.
   */
  pageContext?: PageContext

  /**
   * An instance of a Data Adapter inheriting `IDataAdapter`.
   */
  dataAdapter?: IDataAdapter

  /**
   * Display mode of the component.
   */
  displayMode?: DisplayMode
}
