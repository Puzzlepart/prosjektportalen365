/* eslint-disable max-classes-per-file */
import { ProjectColumn } from './ProjectColumn'

export class SPDataSourceItem {
  public Id?: number = -1
  public Title?: string = ''
  public GtIconName?: string = ''
  public GtSearchQuery?: string = ''
  public GtDataSourceCategory?: string = ''
  public GtDataSourceLevel?: string[] = []
  public GtDataSourceDefault?: boolean = false
  public GtProjectContentColumnsId?: any[] = []
  public GtProjectContentRefinersId?: any[] = []
  public GtProjectContentGroupById?: any = null
  public GtODataQuery?: string = ''
}

export class DataSource {
  public id: number
  public title: string
  public iconName: string
  public searchQuery: string
  public category: string
  public level: string[]
  public isDefault: boolean
  public projectColumns: ProjectColumn[]
  public projectRefiners: any[]
  public projectGroupBy: any
  public odataQuery: string

  /**
   * Constructor for DataSource
   *
   * @param item Item
   * @param columns Project columns
   */
  constructor(public item: SPDataSourceItem, columns: ProjectColumn[] = []) {
    this.id = item.Id
    this.title = item.Title
    this.iconName = item.GtIconName
    this.searchQuery = item.GtSearchQuery
    this.category = item.GtDataSourceCategory
    this.level = item.GtDataSourceLevel
    this.isDefault = item.GtDataSourceDefault
    this.projectColumns = columns.filter(
      (col) => item.GtProjectContentColumnsId.indexOf(col.id) !== -1
    )
    this.projectRefiners = columns.filter(
      (col) => item.GtProjectContentRefinersId.indexOf(col.id) !== -1
    )
    this.projectGroupBy = columns.find(
      (col) => col.id === item.GtProjectContentGroupById
    )
    this.odataQuery = item.GtODataQuery
  }
}
