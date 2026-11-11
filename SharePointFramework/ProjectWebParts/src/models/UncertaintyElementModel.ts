import { IMatrixElementModel } from '../components/DynamicMatrix/MatrixCell/MatrixElement/types'

export class UncertaintyElementModel implements IMatrixElementModel<Record<string, any>> {
  public id: number | string
  public title: string
  public probability: number
  public consequence: number
  public probabilityPostAction: number
  public consequencePostAction: number
  public action: string
  public url: string
  public webId: string
  public webUrl: string
  public siteTitle: string

  constructor(
    public item: Record<string, any>,
    probability?: string,
    consequence?: string,
    probabilityPostAction?: string,
    consequencePostAction?: string
  ) {
    this.id = item.Id ?? item.ID ?? this._aggregatedId(item)
    this.title = item.Title
    this.siteTitle = item.SiteTitle
    this.webUrl = item.SPWebURL
    this.url = item.Path
    this.probability = parseInt(probability || item.GtRiskProbability, 10)
    this.consequence = parseInt(consequence || item.GtRiskConsequence, 10)
    this.probabilityPostAction = parseInt(
      probabilityPostAction || item.GtRiskProbabilityPostAction,
      10
    )
    this.consequencePostAction = parseInt(
      consequencePostAction || item.GtRiskConsequencePostAction,
      10
    )
  }

  /**
   * Generates an id for items originating from cross-site search results, combining
   * the site title initials with the list item id to visually disambiguate items
   * with equal list item ids from different sites.
   */
  private _aggregatedId(item: Record<string, any>): string {
    if (!item.ListItemID) return undefined
    const siteTitleInitials = (item.SiteTitle ?? '').slice(0, 2).toUpperCase()
    return `${siteTitleInitials}${item.ListItemID}`
  }

  public get tooltip() {
    let tooltip = ''
    if (this.siteTitle) tooltip += `${this.siteTitle}: `
    tooltip += this.title
    return tooltip
  }
}
