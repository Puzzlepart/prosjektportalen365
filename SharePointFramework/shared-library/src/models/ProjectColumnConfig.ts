import { SPProjectColumnConfigItem } from './SPProjectColumnConfigItem'

/**
 * Defines the presentation associated with a configured column value.
 */
export type ProjectColumnConfigDictionaryItem = {
  color: string
  iconName: string
  tooltipColumnPropertyName: string
}

/**
 * Looks up presentation settings by column value.
 */
export type ProjectColumnConfigDictionary = Record<string, ProjectColumnConfigDictionaryItem>

/**
 * Maps a persisted column-value configuration to its display settings.
 */
export class ProjectColumnConfig {
  public id?: number
  public columnTitle?: string
  public columnFieldName?: string
  public columnId?: number
  public value?: string
  public color?: string
  public iconName?: string
  public tooltipColumnPropertyName?: string

  constructor(item: SPProjectColumnConfigItem) {
    this.id = item.Id
    this.columnTitle = item.GtPortfolioColumn?.Title
    this.columnFieldName = item.GtPortfolioColumn?.GtInternalName
    this.columnId = item.GtPortfolioColumnId
    this.value = item.GtPortfolioColumnValue
    this.color = item.GtPortfolioColumnColor
    this.iconName = item.GtPortfolioColumnIconName
    this.tooltipColumnPropertyName = item.GtPortfolioColumnTooltip?.GtManagedProperty
  }
}
