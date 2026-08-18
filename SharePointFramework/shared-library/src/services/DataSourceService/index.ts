import { DataSource, SPDataSourceItem } from '../../models/DataSource'
import { ProjectContentColumn } from '../../models'
import { IList } from '@pnp/sp/lists'
import { IWeb } from '@pnp/sp/webs'
import resource from 'SharedResources'
export class DataSourceService {
  private _dataSourcesList: IList
  private _columnsList: IList

  /**
   * Creates a new instance of `DataSourceService`
   *
   * @param web Web
   * @param dataSourcesListName List name is default set to `{resource.Lists_DataSources_Title}` but can be overridden (not recommended)
   * @param columnsListName Columns list name is default set to `{resource.Lists_ProjectContentColumns_Title}` but can be overridden (not recommended)
   */
  constructor(
    public web: IWeb,
    dataSourcesListName = resource.Lists_DataSources_Title,
    columnsListName = resource.Lists_ProjectContentColumns_Title
  ) {
    this._dataSourcesList = web.lists.getByTitle(dataSourcesListName)
    this._columnsList = web.lists.getByTitle(columnsListName)
  }

  /**
   * Get a single data source using the specified OData filter. Returns `null`
   * if no data source matches the filter or if the fetch fails.
   *
   * @param filter OData filter to fetch the data source with
   */
  private async _getSingle(filter: string): Promise<DataSource> {
    try {
      const [[item], columns] = await Promise.all([
        this._dataSourcesList.items.select(...Object.keys(new SPDataSourceItem())).filter(filter)<
          SPDataSourceItem[]
        >(),
        this._columnsList.items.top(500)()
      ])
      return item
        ? new DataSource(
            item,
            (columns ?? []).map((column) => new ProjectContentColumn(column))
          )
        : null
    } catch (error) {
      console.warn(
        `(DataSourceService) (_getSingle) Failed to fetch data source with filter '${filter}':`,
        error
      )
      return null
    }
  }

  /**
   * Get data sources by name.
   *
   * @param name The name of the data source
   *
   * @returns Data source
   */
  public async getByName(name: string): Promise<DataSource> {
    return this._getSingle(`Title eq '${name}'`)
  }

  /**
   * Get data sources by data source ID (`GtDataSourceId`). Unlike the title,
   * the data source ID is stable across install languages and renames.
   *
   * @param dataSourceId The ID (GUID) of the data source
   *
   * @returns Data source
   */
  public async getById(dataSourceId: string): Promise<DataSource> {
    return this._getSingle(`GtDataSourceId eq '${dataSourceId}'`)
  }

  /**
   * Get data sources by category and optional level.
   *
   * @param category Category
   * @param level Level (optional)
   * @param columns Columns to configure data source with (optional)
   */
  public async getByCategory(
    category: string,
    level?: string,
    columns: ProjectContentColumn[] = []
  ): Promise<DataSource[]> {
    let filter = `GtDataSourceCategory eq '${category}'`
    if (level) {
      filter += ` and GtDataSourceLevel eq '${level}'`
    }
    const items = await this._dataSourcesList.items
      .select(...Object.keys(new SPDataSourceItem()))
      .filter(filter)
      .top(500)<SPDataSourceItem[]>()
    return items.map((item) => new DataSource(item, columns))
  }
}
