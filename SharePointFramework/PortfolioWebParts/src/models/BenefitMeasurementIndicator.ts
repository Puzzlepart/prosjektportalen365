import { IBenefitsSearchResult } from 'interfaces'
import { BenefitBase, Benefit, BenefitMeasurement } from './'

export class BenefitMeasurementIndicator extends BenefitBase {
  public Indicator: string
  public StartValue: number
  public DesiredValue: number
  public StartValueDisplay: string
  public DesiredValueDisplay: string
  public Unit: string
  public BenefitItemId: number
  public Measurements: BenefitMeasurement[]
  public Benefit: Benefit

  /**
   * Creates a new instance of BenefitMeasurementIndicator
   *
   * @param result Search result
   * @param fractionDigits Fraction digits for valueDisplay
   */
  constructor(result: IBenefitsSearchResult, fractionDigits: number = 2) {
    super(result)
    this.Indicator = result.GtMeasureIndicatorOWSTEXT
    this.StartValue = !isNaN(parseFloat(result.GtStartValueOWSNMBR))
      ? parseFloat(result.GtStartValueOWSNMBR)
      : null
    if (this.StartValue !== null) {
      this.StartValueDisplay = this.StartValue.toFixed(fractionDigits)
    }
    this.DesiredValue = !isNaN(parseFloat(result.GtDesiredValueOWSNMBR))
      ? parseFloat(result.GtDesiredValueOWSNMBR)
      : null
    if (this.DesiredValue !== null) {
      this.DesiredValueDisplay = this.DesiredValue.toFixed(fractionDigits)
    }
    this.Unit = result.GtMeasurementUnitOWSCHCS
    this.BenefitItemId = parseInt(result.GtGainLookupId, 10)
  }

  /**
   * Set measurements
   *
   * @param measurements Measurements
   */
  public setMeasurements(measurements: BenefitMeasurement[]): BenefitMeasurementIndicator {
    measurements = measurements.filter((m) => m.IndicatorId === this.Id && m.SiteId === this.SiteId)
    measurements = measurements.map((m) => m.calculcateAchievement(this))
    measurements = measurements.map((m, i) => m.setTrendIconProps(measurements[i + 1]))
    this.Measurements = measurements
    return this
  }

  /**
   * Set benefit
   *
   * @param benefits Benefits
   */
  public setBenefit(benefits: Benefit[]): BenefitMeasurementIndicator {
    this.Benefit = benefits.filter(
      (b) => b.Id === this.BenefitItemId && b.SiteId === this.SiteId
    )[0]
    return this
  }
}
