import { ProjectContentColumn } from './ProjectContentColumn'
import _ from 'lodash'

/**
 * Represents a stored data-source definition and its column lookups.
 */
export class SPDataSourceItem {
  public Id?: number = -1
  public Title?: string = ''
  public GtIconName?: string = ''
  public GtSearchQuery?: string = ''
  public GtDataSourceCategory?: string = ''
  public GtDataSourceLevel?: string[] | { results: string[] } = []
  public GtDataSourceDefault?: boolean = false
  public GtProjectContentColumnsId?: number[] | { results: number[] } = []
  public GtProjectContentRefinersId?: number[] | { results: number[] } = []
  public GtProjectContentGroupById?: number = null
  public GtODataQuery?: string = ''
  public GtSortOrder?: number = 100
  public GtDataSourceId?: string = ''
  public GtDataSourceConfig?: string = ''
}

/**
 * Resolves a stored data source's columns, refiners and grouping column.
 */
export class DataSource {
  public id: number
  public title: string
  public iconName: string
  public searchQuery: string
  public category: string
  public level: string[]
  public isDefault: boolean
  public columns: ProjectContentColumn[]
  public refiners: ProjectContentColumn[]
  public groupBy: ProjectContentColumn
  public odataQuery: string
  public columnIds?: number[]
  public refinerIds?: number[]
  public groupById?: number
  public sortOrder: number
  public dataSourceId: string
  public config: string

  constructor(item: SPDataSourceItem, columns: ProjectContentColumn[] = []) {
    this.id = item.Id
    this.title = item.Title
    this.iconName = item.GtIconName
    this.searchQuery = item.GtSearchQuery
    this.category = item.GtDataSourceCategory
    this.level = item.GtDataSourceLevel as string[]
    this.isDefault = item.GtDataSourceDefault
    this.odataQuery = item.GtODataQuery
    this.columnIds = (item.GtProjectContentColumnsId as number[]) ?? []
    this.refinerIds = (item.GtProjectContentRefinersId as number[]) ?? []
    this.groupById = item.GtProjectContentGroupById
    this.sortOrder = item.GtSortOrder ?? 100
    this.dataSourceId = item.GtDataSourceId ?? ''
    this.config = item.GtDataSourceConfig ?? ''
    this.configure(columns)
  }

  /**
   * Updates this data source's title, icon and search query in place.
   */
  public update(item: SPDataSourceItem): DataSource {
    this.title = item.Title
    this.iconName = item.GtIconName
    this.searchQuery = item.GtSearchQuery
    return this
  }

  /**
   * Resolves column and refiner IDs and the grouping lookup against available content columns.
   */
  public configure(columns: ProjectContentColumn[] = []) {
    this.columns = columns.filter((col) => _.includes(this.columnIds, col.id))
    this.refiners = columns.filter((col) => _.includes(this.refinerIds, col.id))
    this.groupBy = columns.find((col) => col.id === this.groupById)
    return this
  }
}
