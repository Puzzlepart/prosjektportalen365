import { IConfigurationFile } from 'types'
import { IBaseWebPartComponentProps } from 'pp365-shared-library/lib/components/BaseWebPartComponent/types'
import { IDynamicMatrixProps } from 'components/DynamicMatrix'
import { UncertaintyElementModel } from 'models'

export type UncertaintyMatrixDataFetchMode = 'auto' | 'list' | 'dataSource'

/**
 * Shared properties for the Risk Matrix and Opportunity Matrix web parts.
 */
export interface IBaseUncertaintyMatrixWebPartProps
  extends IBaseWebPartComponentProps,
    Pick<IDynamicMatrixProps, 'fullWidth' | 'width' | 'calloutTemplate' | 'manualConfigurationPath'> {
  /**
   * How to retrieve the items rendered in the matrix:
   * - `auto` (default): use the data source when the current site is a parent
   *   project or program, otherwise the local uncertainty list
   * - `list`: always use the local uncertainty list (CAML)
   * - `dataSource`: always use the data source (search aggregated over child projects)
   */
  dataFetchMode?: UncertaintyMatrixDataFetchMode

  /**
   * Whether to render the web part title above the matrix (default `false`). The
   * title itself is the `title` web part property, falling back to the web part
   * instance title.
   */
  showTitle?: boolean

  /**
   * The name of the data source to retrieve items from in data source mode. When
   * empty, the default data source for the web part is resolved by its stable
   * data source ID.
   */
  dataSource?: string

  /**
   * Whether to only show items flagged with "Show in portfolio" (`GtShowInPortfolio`)
   * in data source mode (default `true`).
   */
  filterByShowInPortfolio?: boolean

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

export interface IUncertaintyMatrixWebPartData {
  /**
   * The items retrieved from the SharePoint list or data source.
   */
  items?: UncertaintyElementModel[]

  /**
   * The configurations retrieved from the configuration folder at the hub site.
   */
  configurations?: IConfigurationFile[]

  /**
   * The default configuration resolved from the global settings.
   */
  defaultConfiguration?: IConfigurationFile
}

/**
 * Configuration for a concrete uncertainty matrix web part, parameterizing the
 * shared `BaseUncertaintyMatrixWebPart` logic.
 */
export interface IUncertaintyMatrixWebPartConfig {
  /**
   * Name of the content type to filter the local uncertainty list by (e.g. "Risiko")
   */
  contentTypeName: string

  /**
   * Configuration folder for the matrix configurations at the hub site
   */
  configurationFolder: string

  /**
   * Global settings key for the default matrix configuration file
   */
  defaultConfigurationSettingKey: string

  /**
   * `GtDataSourceId` of the default data source for data source mode
   */
  defaultDataSourceId: string

  /**
   * Localized title of the default data source for data source mode
   */
  defaultDataSourceName: string
}
