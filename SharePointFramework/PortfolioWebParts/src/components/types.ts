import { DisplayMode } from '@microsoft/sp-core-library'
import { PageContext } from '@microsoft/sp-page-context'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SPFI } from '@pnp/sp'
import { IPortfolioWebPartsDataAdapter } from 'data/types'

export interface IBaseComponentProps {
  /**
   * Component title. Often rendered as a header.
   */
  title?: string

  /**
   * SPFx web part context needed for miscellanous operations in the components.
   */
  webPartContext?: WebPartContext

  /**
   * Page context from `webPartContext`. It might be neccessary to pass `this.context.pageContext as any` due to
   * mismatch in version of `@microsoft/sp-page-context`.
   */
  pageContext?: PageContext

  /**
   * An instance of a Data Adapter inheriting `IPortfolioWebPartsDataAdapter`.
   */
  dataAdapter?: IPortfolioWebPartsDataAdapter

  /**
   * Display mode of the component.
   */
  displayMode?: DisplayMode

  /**
   * SPFI instance.
   */
  sp?: SPFI
}
