import { DataSource, SPDataSourceItem } from '../../models/DataSource'
import { ProjectContentColumn } from '../../models'
import { IList } from '@pnp/sp/lists'
import { IWeb } from '@pnp/sp/webs'
import resx from 'ResxStrings'
export class DataSourceService {
  private _dataSourcesList: IList
  private _columnsList: IList

  /**
   * Creates a new instance of `DataSourceService`
   *
   * @param web Web
   * @param dataSourcesListName List name is default set to `{resx.Lists_DataSources_Title}` but can be overridden (not recommended)
   * @param columnsListName Columns list name is default set to `{resx.Lists_ProjectContentColumns_Title}` but can be overridden (not recommended)
   */
  constructor(
    public web: IWeb,
    dataSourcesListName = resx.Lists_DataSources_Title,
    columnsListName = resx.Lists_ProjectContentColumns_Title
  ) {
    this._dataSourcesList = web.lists.getByTitle(dataSourcesListName)
    this._columnsList = web.lists.getByTitle(columnsListName)
  }

  /**
   * Get data sources by name.
   *
   * @param name The name of the data source
   * 
   * @returns Data source
   */
  public async getByName(name: string): Promise<DataSource> {
    const [[item], columns] = await Promise.all([
      this._dataSourcesList.items.select(...Object.keys(new SPDataSourceItem())).filter(`Title eq '${name}'`)<
        SPDataSourceItem[]
      >(),
      this._columnsList.items()
    ])
    return item
      ? new DataSource(
        item,
        columns.map((item) => new ProjectContentColumn(item))
      )
      : null
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
      .filter(`GtDataSourceCategory eq '${category}'`)
      .filter(filter)<SPDataSourceItem[]>()
    return items.map((item) => new DataSource(item, columns))
  }
}
