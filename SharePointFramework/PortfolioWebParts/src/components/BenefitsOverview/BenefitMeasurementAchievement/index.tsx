import { Icon } from 'office-ui-fabric-react/lib/Icon'
import React from 'react'
import { IBenefitMeasurementAchievementProps } from './types'

export const BenefitMeasurementAchievement = ({
  measurement
}: IBenefitMeasurementAchievementProps) => {
  if (measurement.AchievementDisplay) {
    return (
      <span>
        <span style={{ display: 'inline-block', width: 20 }}>
          {measurement.TrendIconProps && <Icon {...measurement.TrendIconProps} />}
        </span>
        <span>{measurement.AchievementDisplay}</span>
      </span>
    )
  }
  return null
}
