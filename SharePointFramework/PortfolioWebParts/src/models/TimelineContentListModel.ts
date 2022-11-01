import { TimelineConfigurationListModel } from './TimelineConfigurationListModel'

export class TimelineContentListModel {
  private _config: TimelineConfigurationListModel

  /**
   * Creates a new instance of TimelineContentListModel
   *
   * @param siteId Site id
   * @param title Title
   * @param itemTitle Item title
   * @param type Item type
   * @param startDate Start Date
   * @param endDate End Date
   * @param description Description
   * @param tag Tag
   * @param budgetTotal Budget total
   * @param costsTotal Costs total
   * @param url Url
   * @param phase Phase
   */
  constructor(
    public siteId: string,
    public title: string,
    public itemTitle: string,
    public type: string,
    public startDate?: string,
    public endDate?: string,
    public description?: string,
    public tag?: string,
    public budgetTotal?: string,
    public costsTotal?: string,
    public url?: string,
    public phase?: string
  ) {}

  public setConfig(config: TimelineConfigurationListModel) {
    this._config = config
    return this
  }

  public getConfig<T = string>(key: keyof TimelineConfigurationListModel, fallbackValue: T = null) {
    return (this._config[key] ?? fallbackValue) as T
  }
}
