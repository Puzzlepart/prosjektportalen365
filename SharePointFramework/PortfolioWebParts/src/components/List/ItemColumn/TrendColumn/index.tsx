import React, { FC } from 'react'
import { ITrendColumnProps } from './types'
import { tryParseJson } from 'pp365-shared-library'
import { Icon } from '@fluentui/react'

export const TrendColumn: FC<ITrendColumnProps> = (props) => {
  const trend = tryParseJson(props.columnValue, null)
  return trend ? (
    <span>
      <span style={{ display: 'inline-block', width: 20 }}>
        {trend.TrendIconProps && props.showTrendIcon && <Icon {...trend.TrendIconProps} />}
      </span>
      <span>{trend.AchievementDisplay}</span>
    </span>
  ) : null
}

TrendColumn.defaultProps = {
  showTrendIcon: true
}
