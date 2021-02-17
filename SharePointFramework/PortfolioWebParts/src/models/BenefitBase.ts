import { IBenefitsSearchResult } from 'interfaces'

export class BenefitBase {
  public SiteTitle: string
  public SPWebURL: string
  public id: number
  public title: string
  public siteId: string

  constructor(result: IBenefitsSearchResult) {
    this.SiteTitle = result.SiteTitle
    this.SPWebURL = result.SPWebURL
    this.id = parseInt(result.ListItemId, 10)
    this.title = result.Title
    this.siteId = result.SiteId
  }
}
