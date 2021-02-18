import { BenefitMeasurement } from 'models'
import { HTMLProps } from 'react'

export interface IBenefitMeasurementAchievementProps extends HTMLProps<HTMLSpanElement> {
  measurement: BenefitMeasurement
}
