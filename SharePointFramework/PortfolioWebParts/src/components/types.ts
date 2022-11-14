import { DisplayMode } from '@microsoft/sp-core-library'
import { PageContext } from '@microsoft/sp-page-context'
import { SPFI } from '@pnp/sp'
import { IDataAdapter } from 'data/types'

export interface IBaseComponentProps {
  /**
   * Component title.
   */
  title?: string

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

  /**
   * SP instance
   */
   sp: SPFI
}
