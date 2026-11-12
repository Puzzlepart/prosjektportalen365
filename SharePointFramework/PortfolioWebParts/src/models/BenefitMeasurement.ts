import { BenefitBase, BenefitMeasurementIndicator } from './'
import { IBenefitsSearchResult } from 'interfaces'
import { formatShortDate, ITrendIcon } from 'pp365-shared-library'

/** A measured value with formatted display, achievement and trend details. */
export class BenefitMeasurement extends BenefitBase {
  public Date: Date
  public DateDisplay: string
  public Comment: string
  public Value: number
  public ValueDisplay: string
  public Achievement: number
  public AchievementDisplay: string
  public TrendIcon: ITrendIcon
  public IndicatorId: number
  public Indicator: BenefitMeasurementIndicator

  /**
   * Read a measurement from search.
   *
   * @param fractionDigits Decimal places in the displayed measurement value.
   */
  constructor(result: IBenefitsSearchResult, fractionDigits: number = 2) {
    super(result)
    this.Date = new Date(result.GtMeasurementDateOWSDATE)
    // For display only: the Excel export writes `Date` itself.
    this.DateDisplay = formatShortDate(this.Date)
    this.Value = !isNaN(parseFloat(result.GtMeasurementValueOWSNMBR))
      ? parseFloat(result.GtMeasurementValueOWSNMBR)
      : null
    if (this.Value !== null) {
      this.ValueDisplay = this.Value.toFixed(fractionDigits)
    }
    this.Comment = result.GtMeasurementCommentOWSMTXT
    this.IndicatorId = parseInt(result.GtMeasureIndicatorLookupId, 10)
  }

  /**
   * Calculate progress from the indicator's start value towards its desired value.
   *
   * @param fractionDigits Decimal places in the displayed percentage.
   */
  public calculcateAchievement(
    indicator: BenefitMeasurementIndicator,
    fractionDigits: number = 2
  ): BenefitMeasurement {
    this.Indicator = indicator
    const achievement =
      ((this.Value - this.Indicator.StartValue) /
        (this.Indicator.DesiredValue - this.Indicator.StartValue)) *
      100
    this.Achievement = achievement
    this.AchievementDisplay = `${achievement.toFixed(fractionDigits)}%`
    return this
  }

  /**
   * Mark a reached goal or improvement or decline against the previous measurement.
   */
  public setTrendIcon(prevMeasurement: BenefitMeasurement): BenefitMeasurement {
    const shouldIncrease = this.Indicator.DesiredValue > this.Indicator.StartValue
    if (this.Achievement >= 100) {
      // As hex, which the trend cell can measure to frame it (gold stands out too little).
      this.TrendIcon = { iconName: 'Trophy', color: '#ffd700' }
      return this
    }
    if (prevMeasurement && prevMeasurement.Value !== this.Value) {
      const hasIncreased = this.Value > prevMeasurement.Value
      if ((shouldIncrease && hasIncreased) || (!shouldIncrease && !hasIncreased)) {
        this.TrendIcon = { iconName: 'CaretUp', color: '#27ae60' }
      } else {
        this.TrendIcon = { iconName: 'CaretDown', color: '#e74c3c' }
      }
    }
    return this
  }
}
