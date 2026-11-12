import { IBenefitsSearchResult } from 'interfaces'
import { BenefitBase, Benefit, BenefitMeasurement } from './'

/** A benefit's target values and the measurements linked to them. */
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
   * Read an indicator and its numeric targets from search.
   *
   * @param fractionDigits Decimal places in displayed start and desired values.
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
   * Attach matching measurements and calculate achievement and trends in input order.
   *
   * @param measurements Measurements ordered newest first for comparison with the next entry.
   */
  public setMeasurements(measurements: BenefitMeasurement[]): BenefitMeasurementIndicator {
    measurements = measurements.filter((m) => m.IndicatorId === this.Id && m.SiteId === this.SiteId)
    measurements = measurements.map((m) => m.calculcateAchievement(this))
    measurements = measurements.map((m, i) => m.setTrendIcon(measurements[i + 1]))
    this.Measurements = measurements
    return this
  }

  /**
   * Attach the benefit with the matching item and site IDs.
   */
  public setBenefit(benefits: Benefit[]): BenefitMeasurementIndicator {
    this.Benefit = benefits.filter(
      (b) => b.Id === this.BenefitItemId && b.SiteId === this.SiteId
    )[0]
    return this
  }
}
