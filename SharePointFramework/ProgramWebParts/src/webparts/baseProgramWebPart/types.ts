import { DisplayMode } from '@microsoft/sp-core-library'
import { PageContext } from '@microsoft/sp-page-context'
import { DataAdapter } from 'data'

export interface IBaseProgramWebPartProps {
  title?: string
  pageContext?: PageContext
  dataAdapter?: DataAdapter
  displayMode?: DisplayMode
}
