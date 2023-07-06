import { Checkbox, ICheckboxProps, Icon } from '@fluentui/react'
import { tryParseJson } from 'pp365-shared-library'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { ITrendColumnProps } from './types'
import strings from 'PortfolioWebPartsStrings'

export const TrendColumn: ColumnRenderComponent<ITrendColumnProps> = (props) => {
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
TrendColumn.key = 'trend'
TrendColumn.id = 'Trend'
TrendColumn.displayName = strings.ColumnRenderOptionTrend
TrendColumn.iconName = 'Trending12'
TrendColumn.getDataTypeOption = () => ({
  key: TrendColumn.key,
  id: TrendColumn.id,
  text: TrendColumn.displayName,
  disabled: true,
  data: {
    iconProps: { iconName: TrendColumn.iconName },
    getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
      [
        Checkbox,
        {
          label: strings.ColumnRenderOptionTrendShowTrendIconLabel,
          defaultChecked: TrendColumn.defaultProps.showTrendIcon,
          checked: dataTypeProperties.showTrendIcon,
          onChange: (_, checked) => onChange('showTrendIcon', checked)
        } as ICheckboxProps
      ]
    ]
  }
})
