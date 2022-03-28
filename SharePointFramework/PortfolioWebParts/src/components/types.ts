import { DisplayMode } from '@microsoft/sp-core-library'
import { PageContext } from '@microsoft/sp-page-context'
import { IDataAdapter } from 'data/types'

export interface IBaseComponentProps {
  title?: string
  pageContext?: PageContext
  dataAdapter?: IDataAdapter
  displayMode?: DisplayMode
}
