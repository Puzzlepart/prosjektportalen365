import { DisplayMode } from '@microsoft/sp-core-library'
import { SPFI } from '@pnp/sp'
import { IPortfolioWebPartsDataAdapter } from 'data/types'
import { SiteContext } from 'pp365-shared-library'

/** Site context and services passed from portfolio web parts to their components. */
export interface IBaseComponentProps extends SiteContext {
  /**
   * Component title. Often rendered as a header.
   */
  title?: string

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

  /**
   * The ID of the SPFx component.
   */
  manifestId?: string
}
