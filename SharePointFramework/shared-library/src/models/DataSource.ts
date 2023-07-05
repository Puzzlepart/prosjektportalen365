/* eslint-disable max-classes-per-file */
import { ProjectContentColumn } from './ProjectContentColumn'
import _ from 'lodash'

export class SPDataSourceItem {
  public Id?: number = -1
  public Title?: string = ''
  public GtIconName?: string = ''
  public GtSearchQuery?: string = ''
  public GtDataSourceCategory?: string = ''
  public GtDataSourceLevel?: string[] = []
  public GtDataSourceDefault?: boolean = false
  public GtProjectContentColumnsId?: number[] | { results: number[] } = []
  public GtProjectContentRefinersId?: number[] | { results: number[] } = []
  public GtProjectContentGroupById?: number = null
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
  public columns: ProjectContentColumn[]
  public refiners: ProjectContentColumn[]
  public groupBy: ProjectContentColumn
  public odataQuery: string

  /**
   * Constructor for DataSource
   *
   * @param item Item
   * @param columns Project content columns
   */
  constructor(public item: SPDataSourceItem, columns: ProjectContentColumn[] = []) {
    this.id = item.Id
    this.title = item.Title
    this.iconName = item.GtIconName
    this.searchQuery = item.GtSearchQuery
    this.category = item.GtDataSourceCategory
    this.level = item.GtDataSourceLevel
    this.isDefault = item.GtDataSourceDefault
    this.columns = columns.filter((col) =>
      _.includes(item.GtProjectContentColumnsId as number[], col.id)
    )
    this.refiners = columns.filter((col) =>
      _.includes(item.GtProjectContentRefinersId as number[], col.id)
    )
    this.groupBy = columns.find((col) => col.id === item.GtProjectContentGroupById)
    this.odataQuery = item.GtODataQuery
  }
}
