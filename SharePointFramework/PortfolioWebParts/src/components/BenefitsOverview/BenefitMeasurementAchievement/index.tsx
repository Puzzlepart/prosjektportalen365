import React from 'react'
import { BenefitMeasurement } from 'models'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import * as objectGet from 'object-get'

export interface IBenefitMeasurementAchievementProps extends React.HTMLProps<HTMLSpanElement> {
  measurement: BenefitMeasurement
}

export default class BenefitMeasurementAchievement extends React.PureComponent<
  IBenefitMeasurementAchievementProps,
  {}
> {
  constructor(props: IBenefitMeasurementAchievementProps) {
    super(props)
  }

  public render(): React.ReactElement<IBenefitMeasurementAchievementProps> {
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
