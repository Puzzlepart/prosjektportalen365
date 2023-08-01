import { DataSource, SPDataSourceItem } from '../../models/DataSource'
import { ProjectContentColumn } from '../../models'
import { IList } from '@pnp/sp/lists'
import { IWeb } from '@pnp/sp/webs'

export class DataSourceService {
  private list: IList
  private columnsList: IList

  /**
   * Creates a new instance of DataSourceService
   *
   * @param web Web
   * @param listName List name is default set to 'Datakilder' but can be overridden (not recommended)
   * @param columnsListName Columns list name is default set to 'Prosjektinnholdskolonner' but can be overridden (not recommended)
   */
  constructor(
    public web: IWeb,
    listName = 'Datakilder',
    columnsListName = 'Prosjektinnholdskolonner'
  ) {
    this.list = web.lists.getByTitle(listName)
    this.columnsList = web.lists.getByTitle(columnsListName)
  }

  /**
   * Get by name
   *
   * @param name Name
   */
  public async getByName(name: string): Promise<DataSource> {
    const [[item], columns] = await Promise.all([
      this.list.items
        .select(...Object.keys(new SPDataSourceItem()))
        .filter(`Title eq '${name}'`)<SPDataSourceItem[]>(),
      this.columnsList.items()
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
    const items = await this.list.items
      .select(...Object.keys(new SPDataSourceItem()))
      .filter(`GtDataSourceCategory eq '${category}'`)
      .filter(filter)<SPDataSourceItem[]>()
    return items.map((item) => new DataSource(item, columns))
  }
}
