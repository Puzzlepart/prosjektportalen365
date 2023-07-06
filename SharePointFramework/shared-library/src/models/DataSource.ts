/* eslint-disable max-classes-per-file */
import { ProjectContentColumn } from './ProjectContentColumn'
import _ from 'lodash'

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
  public columnIds?: number[]
  public refinerIds?: number[]
  public groupById?: number

  /**
   * Constructor for DataSource
   *
   * @param item Item
   * @param columns Project content columns
   */
  constructor(item: SPDataSourceItem, columns: ProjectContentColumn[] = []) {
    this.id = item.Id
    this.title = item.Title
    this.iconName = item.GtIconName
    this.searchQuery = item.GtSearchQuery
    this.category = item.GtDataSourceCategory
    this.level = item.GtDataSourceLevel as string[]
    this.isDefault = item.GtDataSourceDefault
    this.odataQuery = item.GtODataQuery
    this.columnIds = item.GtProjectContentColumnsId as number[] ?? []
    this.refinerIds = item.GtProjectContentRefinersId as number[] ?? []
    this.groupById = item.GtProjectContentGroupById
    this.configure(columns)
  }

  /**
   * Configures the DataSource instance with the provided project content columns.
   * Filters the provided columns to match the columns specified in the SPDataSourceItem instance.
   * Sets the columns, refiners, and groupBy properties of the DataSource instance.
   *
   * @param columns The project content columns to filter and configure the DataSource instance with.
   * 
   * @returns The configured DataSource instance.
   */
  public configure(columns: ProjectContentColumn[] = []) {
    this.columns = columns.filter((col) =>
      _.includes(this.columnIds, col.id)
    )
    this.refiners = columns.filter((col) =>
      _.includes(this.refinerIds, col.id)
    )
    this.groupBy = columns.find((col) => col.id === this.groupById)
    return this
  }
}
