import { TimelineConfigurationModel } from './TimelineConfigurationModel'

export class TimelineContentModel {
  private _config: TimelineConfigurationModel

  /**
   * Creates a new instance of TimelineContentModel
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

  /**
   * Returns the `TimelineContentModel` using the specified `config`.
   *
   * @param config Timeline configuration
   */
  public usingConfig(config: TimelineConfigurationModel) {
    this._config = config
    return this
  }

  /**
   * Get configuration entry by key
   *
   * @param key Configuration key
   * @param fallbackValue Fallback value
   */
  public getConfig<T = string>(
    key: keyof TimelineConfigurationModel,
    fallbackValue: T = null
  ) {
    return (this._config[key] ?? fallbackValue) as T
  }
}
