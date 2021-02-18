import { Icon } from 'office-ui-fabric-react/lib/Icon'
import { get } from '@microsoft/sp-lodash-subset'
import React, { PureComponent, ReactElement } from 'react'
import { IBenefitMeasurementAchievementProps } from './types'

export default class BenefitMeasurementAchievement extends PureComponent<
  IBenefitMeasurementAchievementProps
> {
  public render(): ReactElement<IBenefitMeasurementAchievementProps> {
    const colValue = get(this.props.measurement, 'achievementDisplay')
    const trendIconProps = get(this.props.measurement, 'trendIconProps')
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
