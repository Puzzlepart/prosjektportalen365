import strings from 'SharedLibraryStrings'
import { tryParseJson } from '../../../util'
import { getFluentIcon } from '../../../icons'
import { ITrendIcon } from '../../../types'
import React from 'react'
import { checkboxField } from '../ColumnDataTypeField'
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
  const icon: ITrendIcon | undefined = trend?.TrendIcon
  return trend ? (
    <span className={styles.root}>
      <span className={styles.iconContainer}>
        {icon && props.showTrendIcon && getFluentIcon(icon.iconName, { color: icon.color })}
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
  checkboxField({
    label: strings.ColumnRenderOptionTrendShowTrendIconLabel,
    checked: dataTypeProperties.showTrendIcon ?? TrendColumn.defaultProps.showTrendIcon,
    onChange: (checked) => onChange('showTrendIcon', checked)
  })
]
