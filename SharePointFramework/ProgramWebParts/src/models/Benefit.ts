import { IBenefitsSearchResult } from 'interfaces'
import { BenefitBase } from './'

/**
 * @class Benefit
 */
export class Benefit extends BenefitBase {
  public Type: string
  public Turnover: string
  public Responsible: string
  public Owner: string
  public RealizationTime: Date

  /**
   *
   */
  constructor(result: IBenefitsSearchResult) {
    super(result)
    this.Type = result.GtGainsTypeOWSCHCS
    this.Turnover = result.GtGainsTurnoverOWSMTXT
    this.Responsible = result.GtGainsResponsible
    this.Owner = result.GtGainsOwner
    this.RealizationTime = new Date(result.GtRealizationTimeOWSDATE)
  }
}
