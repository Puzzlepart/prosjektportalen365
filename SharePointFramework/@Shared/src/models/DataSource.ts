/* eslint-disable max-classes-per-file */
export class SPDataSourceItem {
  public Id?: number = -1
  public Title?: string = ''
  public GtIconName?: string = ''
  public GtSearchQuery?: string = ''
  public GtDataSourceCategory?: string = ''
  public GtDataSourceDefault?: boolean = false
  public GtPortfolioColumns?: any[]
  public GtPortfolioRefiners?: any[]
  public GtPortfolioGroupBy?: any[]
  public GtODataQuery?: string = ''
}

export class DataSource {
  public id: number
  public title: string
  public iconName: string
  public searchQuery: string
  public category: string
  public isDefault: boolean
  public projectColumns: any[]
  public projectRefiners: any[]
  public projectGroupBy: any[]
  public odataQuery: string

  /**
   * DataSource
   *
   * @param {SPDataSourceItem} item Item
   */
  constructor(public item: SPDataSourceItem) {
    // eslint-disable-next-line no-console
    console.log(item)
    this.id = item.Id
    this.title = item.Title
    this.iconName = item.GtIconName
    this.searchQuery = item.GtSearchQuery
    this.category = item.GtDataSourceCategory
    this.isDefault = item.GtDataSourceDefault
    this.projectColumns = item.GtPortfolioColumns
    this.projectRefiners = item.GtPortfolioRefiners
    this.projectGroupBy = item.GtPortfolioGroupBy
    this.odataQuery = item.GtODataQuery
  }
}
