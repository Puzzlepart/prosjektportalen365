/* eslint-disable max-classes-per-file */

export class SPTimelineConfigurationItem {
  public Title: string = ''
  public GtSortOrder: number = 99
  public GtHexColor: string = null
  public GtHexColorText: string = null
  public GtTimelineCategory: string = null
  public GtElementType: string = null
  public GtShowElementPortfolio: boolean = false
  public GtShowElementProgram: boolean = false
  public GtTimelineFilter: boolean = false

  public get fields(): string[] {
    return Object.keys(this)
  }
}

export class TimelineConfigurationModel {
  public sortOrder: number
  public title: string
  public bgColorHex: string
  public textColorHex: string
  public timelineCategory: string
  public elementType: any
  public showElementPortfolio: any
  public showElementProgram: any
  public timelineFilter: any

  /**
   * Creates a new instance of TimelineConfigurationModel
   *
   * @param item SP item
   */
  constructor(item: SPTimelineConfigurationItem) {
    this.sortOrder = item.GtSortOrder
    this.title = item.Title
    this.bgColorHex = item.GtHexColor
    this.textColorHex = item.GtHexColorText
    this.timelineCategory = item.GtTimelineCategory
    this.elementType = item.GtElementType
    this.showElementPortfolio = item.GtShowElementPortfolio
    this.showElementProgram = item.GtShowElementProgram
    this.timelineFilter = item.GtTimelineFilter
  }
}
