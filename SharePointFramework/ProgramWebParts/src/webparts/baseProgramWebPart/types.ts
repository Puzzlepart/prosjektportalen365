import { DisplayMode } from '@microsoft/sp-core-library'
import { PageContext } from '@microsoft/sp-page-context'
import { SPFI } from '@pnp/sp'
import { SPDataAdapter } from 'data'

export interface IBaseProgramWebPartProps {
  title?: string
  sp?: SPFI
  pageContext?: PageContext
  dataAdapter?: SPDataAdapter
  displayMode?: DisplayMode
}
