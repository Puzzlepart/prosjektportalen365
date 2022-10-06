import { List, Web } from '@pnp/sp'
import { DataSource, SPDataSourceItem } from '../../models/DataSource'
import { ProjectColumn } from '../../models/ProjectColumn'

export class DataSourceService {
  private list: List
  private columnsList: List

  /**
   * Creates a new instance of DataSourceService
   *
   * @param web Web
   * @param listName List name
   * @param columnsListName Columns list name
   */
  constructor(
    public web: Web,
    listName = 'Datakilder',
    columnsListName = 'Prosjektinnholdskolonner'
  ) {
    this.list = web.lists.getByTitle(listName)
    this.columnsList = web.lists.getByTitle(columnsListName)
  }

  /**
   * Get by name
   *
   * @param {string} name Name
   */
  public async getByName(name: string): Promise<DataSource> {
    const [[item], _columns] = await Promise.all([
      this.list.items
        .select(...Object.keys(new SPDataSourceItem()))
        .filter(`Title eq '${name}'`)
        .get<SPDataSourceItem[]>(),
      this.columnsList.items.get()
    ])
    if (item) {
      const columns = _columns.map((item) => new ProjectColumn(item))
      return new DataSource(item, columns)
    } else {
      return null
    }
  }

  /**
   * Get by category
   *
   * @param {string} category Category
   */
  public async getByCategory(category: string): Promise<DataSource[]> {
    const items = await this.list.items
      .select(...Object.keys(new SPDataSourceItem()))
      .filter(`GtDataSourceCategory eq '${category}'`)
      .get<SPDataSourceItem[]>()
    return items.map((item) => new DataSource(item))
  }
}
