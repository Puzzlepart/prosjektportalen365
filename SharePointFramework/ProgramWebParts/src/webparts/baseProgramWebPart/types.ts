import { DisplayMode } from '@microsoft/sp-core-library'
import { PageContext } from '@microsoft/sp-page-context'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { SPFI } from '@pnp/sp'
import { SPDataAdapter } from 'data'

export interface IBaseProgramWebPartProps {
  title?: string
  sp?: SPFI
  spfxContext?: WebPartContext
  pageContext?: PageContext
  dataAdapter?: SPDataAdapter
  displayMode?: DisplayMode
}
