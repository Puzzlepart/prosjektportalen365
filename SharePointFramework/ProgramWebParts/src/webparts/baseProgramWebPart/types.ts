import { DisplayMode } from '@microsoft/sp-core-library'
import { PageContext } from '@microsoft/sp-page-context'
import { SPFI } from '@pnp/sp'
import { SPDataAdapter } from 'data/SPDataAdapter'

/** Common program web-part properties and dependencies injected into rendered components. */
export interface IBaseProgramWebPartProps {
  title?: string
  sp?: SPFI
  pageContext?: PageContext
  dataAdapter?: SPDataAdapter
  displayMode?: DisplayMode
}
