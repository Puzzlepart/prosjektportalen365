import { BenefitBase, BenefitMeasurementIndicator } from './'
import { IBenefitsSearchResult } from 'interfaces'
import { IIconProps } from '@fluentui/react/lib/Icon'

export class BenefitMeasurement extends BenefitBase {
  public Date: Date
  public DateDisplay: string
  public Comment: string
  public Value: number
  public ValueDisplay: string
  public Achievement: number
  public AchievementDisplay: string
  public TrendIconProps: IIconProps
  public IndicatorId: number
  public Indicator: BenefitMeasurementIndicator

  /**
   * Creates a new instance of BenefitMeasurement
   *
   * @param result Search result
   * @param fractionDigits Fraction digits for valueDisplay
   */
  constructor(result: IBenefitsSearchResult, fractionDigits: number = 2) {
    super(result)
    this.Date = new Date(result.GtMeasurementDateOWSDATE)
    this.DateDisplay = this.Date.toLocaleDateString()
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
   * Calculate achievement
   *
   * @param indicator Indicator
   * @param fractionDigits Fraction digits used for achievementDisplay
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
   * Set trend icon props
   *
   * @param prevMeasurement Previous measurement
   */
  public setTrendIconProps(prevMeasurement: BenefitMeasurement): BenefitMeasurement {
    const shouldIncrease = this.Indicator.DesiredValue > this.Indicator.StartValue
    if (this.Achievement >= 100) {
      this.TrendIconProps = { iconName: 'Trophy', style: { color: 'gold' } }
      return this
    }
    if (prevMeasurement && prevMeasurement.Value !== this.Value) {
      const hasIncreased = this.Value > prevMeasurement.Value
      if ((shouldIncrease && hasIncreased) || (!shouldIncrease && !hasIncreased)) {
        this.TrendIconProps = { iconName: 'StockUp', style: { color: '#27ae60' } }
      } else {
        this.TrendIconProps = { iconName: 'StockDown', style: { color: '#e74c3c' } }
      }
    }
    return this
  }
}
