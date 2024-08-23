import { IConfigurationFile } from 'types'
import { IBaseWebPartComponentProps } from 'pp365-shared-library/lib/components/BaseWebPartComponent/types'
import { IRiskMatrixProps } from '../../components/RiskMatrix'
import { UncertaintyElementModel } from 'models'

/**
 * Interface for the properties of the Risk Matrix web part.
 * Extends IBaseWebPartComponentProps and IRiskMatrixProps interfaces.
 */
export interface IRiskMatrixWebPartProps extends IBaseWebPartComponentProps, IRiskMatrixProps {
  /**
   * Use a data source to retrieve data from for the items in the matrix.
   */
  useDataSource?: boolean

  /**
   * The name of the data source to retrieve data from.
   */
  dataSource?: string

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

export interface IRiskMatrixWebPartData {
  /**
   * The items retrieved from the SharePoint list related to the project.
   */
  items?: UncertaintyElementModel[]

  /**
   * The configurations retrieved from the SharePoint list at hub.
   */
  configurations?: IConfigurationFile[]

  /**
   * The default configuration retrieved from the SharePoint list at hub.
   */
  defaultConfiguration?: IConfigurationFile
}
