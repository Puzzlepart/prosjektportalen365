import { IOpportunityMatrixProps } from 'components/OpportunityMatrix'
import { UncertaintyElementModel } from 'models'
import { IBaseWebPartComponentProps } from 'pp365-shared-library/lib/components/BaseWebPartComponent/types'
import { IConfigurationFile } from 'types'

/**
 * Interface for the properties of the Opportunity Matrix web part.
 * Extends IBaseWebPartComponentProps and IOpportunityMatrixProps interfaces.
 */
export interface IOpportunityMatrixWebPartProps
  extends IBaseWebPartComponentProps,
    IOpportunityMatrixProps {
  /**
   * The name of the SharePoint list to retrieve data from.
   */
  listName?: string

  /**
   * The CAML query to filter items in the SharePoint list.
   */
  viewXml?: string

  /**
   * The internal name of the field in the SharePoint list that stores the probability values.
   */
  probabilityFieldName?: string

  /**
   * The internal name of the field in the SharePoint list that stores the consequence values
   */
  consequenceFieldName?: string

  /**
   * The internal name of the field in the SharePoint list that stores the post-action probability values.
   */
  probabilityPostActionFieldName?: string

  /**
   * The internal name of the field in the SharePoint list that stores the post-action consequence values.
   */
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
