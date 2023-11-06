import { IOpportunityMatrixProps } from 'components/OpportunityMatrix'
import { UncertaintyElementModel } from 'models'
import { IBaseWebPartComponentProps } from 'pp365-shared-library/lib/components/BaseWebPartComponent/types'
import { IConfigurationFile } from 'types'

export interface IOpportunityMatrixWebPartProps
  extends IBaseWebPartComponentProps,
    IOpportunityMatrixProps {
  listName?: string
  viewXml?: string
  probabilityFieldName?: string
  consequenceFieldName?: string
  probabilityPostActionFieldName?: string
  consequencePostActionFieldName?: string
}

export interface IOpportunityMatrixWebPartData {
  /**
   * The items retrieved from the SharePoint list.
   */
  items?: UncertaintyElementModel[]

  /**
   * The configurations retrieved from the SharePoint list.
   */
  configurations?: IConfigurationFile[]

  /**
   * The default configuration retrieved from the SharePoint list.
   */
  defaultConfiguration?: IConfigurationFile
}
