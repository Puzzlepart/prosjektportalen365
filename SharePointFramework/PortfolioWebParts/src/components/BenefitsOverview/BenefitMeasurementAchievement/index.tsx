import { BenefitMeasurement } from 'models'
import * as objectGet from 'object-get'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import React, { HTMLProps, PureComponent, ReactElement } from 'react'

export interface IBenefitMeasurementAchievementProps extends HTMLProps<HTMLSpanElement> {
  measurement: BenefitMeasurement
}

export default class BenefitMeasurementAchievement extends PureComponent<
  IBenefitMeasurementAchievementProps
> {
  constructor(props: IBenefitMeasurementAchievementProps) {
    super(props)
  }

  public render(): ReactElement<IBenefitMeasurementAchievementProps> {
    const colValue = objectGet(this.props.measurement, 'achievementDisplay')
    const trendIconProps = objectGet(this.props.measurement, 'trendIconProps')
    if (colValue) {
      return (
        <span>
          <span style={{ display: 'inline-block', width: 20 }}>
            {trendIconProps && <Icon {...trendIconProps} />}
          </span>
          <span>{colValue}</span>
        </span>
      )
    }
    return null
  }
}
