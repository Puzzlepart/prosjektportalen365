import { SPProjectColumnConfigItem } from './SPProjectColumnConfigItem'

export type ProjectColumnConfigDictionary = { [key: string]: { color: string; iconName: string } }

export class ProjectColumnConfig {
  public id?: number
  public columnTitle?: string
  public columnFieldName?: string
  public columnId?: number
  public value?: string
  public color?: string
  public iconName?: string
  public tooltipColumnFieldName?: string

  constructor(item: SPProjectColumnConfigItem) {
    this.id = item.Id
    this.columnTitle = item.GtPortfolioColumn?.Title
    this.columnFieldName = item.GtPortfolioColumn?.GtInternalName
    this.columnId = item.GtPortfolioColumnId
    this.value = item.GtPortfolioColumnValue
    this.color = item.GtPortfolioColumnColor
    this.iconName = item.GtPortfolioColumnIconName
    this.tooltipColumnFieldName = item.GtPortfolioColumnTooltip?.GtInternalName
  }
}
