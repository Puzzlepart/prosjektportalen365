import strings from 'SharedLibraryStrings'
import { tryParseJson, withDefaults } from '../../../util'
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
/**
 * The size the v8 font icon rendered at inside the cell's 20px icon container.
 */
export const TREND_ICON_SIZE = 20

const TREND_COLUMN_DEFAULT_PROPS: Partial<ITrendColumnProps> = {
  showTrendIcon: true
}

export const TrendColumn: ColumnRenderComponent<ITrendColumnProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, TREND_COLUMN_DEFAULT_PROPS)
  const trend = tryParseJson(props.columnValue)
  const icon: ITrendIcon | undefined = trend?.TrendIcon
  return trend ? (
    <span className={styles.root}>
      <span className={styles.iconContainer}>
        {icon &&
          props.showTrendIcon &&
          getFluentIcon(icon.iconName, { color: icon.color, size: TREND_ICON_SIZE, filled: true })}
      </span>
      <span>{trend.AchievementDisplay}</span>
    </span>
  ) : null
}
TrendColumn.key = 'trend'
TrendColumn.id = 'Trend'
TrendColumn.displayName = strings.ColumnRenderOptionTrend
TrendColumn.iconName = 'Trending12'
TrendColumn.isDisabled = true
TrendColumn.getDataTypeProperties = (onChange, dataTypeProperties: Record<string, any>) => [
  checkboxField({
    label: strings.ColumnRenderOptionTrendShowTrendIconLabel,
    checked: dataTypeProperties.showTrendIcon ?? TREND_COLUMN_DEFAULT_PROPS.showTrendIcon,
    onChange: (checked) => onChange('showTrendIcon', checked)
  })
]
