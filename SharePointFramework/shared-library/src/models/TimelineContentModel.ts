import { TimelineConfigurationModel } from './TimelineConfigurationModel'

/**
 * Combines timeline content with optional type-specific display configuration.
 */
export class TimelineContentModel {
  private _config: TimelineConfigurationModel

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
    public phase?: string,
    public properties?: any
  ) {}

  /**
   * Returns the `TimelineContentModel` using the specified `config`.
   */
  public usingConfig(config: TimelineConfigurationModel) {
    this._config = config
    return this
  }

  /**
   * Get configuration entry by key
   */
  public getConfig<T = string>(key: keyof TimelineConfigurationModel, fallbackValue: T = null) {
    if (!this._config) {
      return fallbackValue as T
    }
    return (this._config[key] ?? fallbackValue) as T
  }
}
