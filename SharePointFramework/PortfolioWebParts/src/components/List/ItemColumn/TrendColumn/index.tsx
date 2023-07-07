import { Checkbox, ICheckboxProps, Icon } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { tryParseJson } from 'pp365-shared-library'
import React from 'react'
import { IColumnDataTypePropertyField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import styles from './TrendColumn.module.scss'
import { ITrendColumnProps } from './types'

/**
 * Renders a column that displays a trend icon and an achievement display value.
 *
 * @param props - The component props.
 * @param props.columnValue - The value of the column.
 * @param props.showTrendIcon - Whether to show the trend icon or not.
 *
 * @returns The rendered component.
 */
export const TrendColumn: ColumnRenderComponent<ITrendColumnProps> = (props) => {
  const trend = tryParseJson(props.columnValue)
  return trend ? (
    <span className={styles.root}>
      <span className={styles.iconContainer}>
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
TrendColumn.isDisabled = true
TrendColumn.getDataTypeProperties = (onChange, dataTypeProperties: Record<string, any>) => [
  {
    type: Checkbox,
    props: {
      label: strings.ColumnRenderOptionTrendShowTrendIconLabel,
      defaultChecked: TrendColumn.defaultProps.showTrendIcon,
      checked: dataTypeProperties.showTrendIcon,
      onChange: (_, checked) => onChange('showTrendIcon', checked)
    }
  } as IColumnDataTypePropertyField<ICheckboxProps>
]