import { IBenefitsSearchResult } from 'interfaces'

export class BenefitBase {
  public SiteTitle: string
  public SPWebURL: string
  public Id: number
  public Title: string
  public SiteId: string
  public Properties: any

  constructor(result: IBenefitsSearchResult) {
    this.SiteTitle = result.SiteTitle
    this.SPWebURL = result.SPWebURL
    this.Id = parseInt(result.ListItemId, 10)
    this.Title = result.Title
    this.SiteId = result.SiteId
    this.Properties = result
  }
}
