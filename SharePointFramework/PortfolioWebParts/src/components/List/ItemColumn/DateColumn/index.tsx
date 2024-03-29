import { Toggle } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { formatDate } from 'pp365-shared-library'
import React from 'react'
import { ColumnDataTypePropertyField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import { IDateColumnProps } from './types'

export const DateColumn: ColumnRenderComponent<IDateColumnProps> = (props) => {
  return <span>{formatDate(props.columnValue, props.includeTime)}</span>
}

DateColumn.key = 'date'
DateColumn.id = 'Date'
DateColumn.displayName = strings.ColumnRenderOptionDate
DateColumn.iconName = 'Calendar'
DateColumn.getDataTypeProperties = (onChange, dataTypeProperties: Record<string, any>) => [
  ColumnDataTypePropertyField(Toggle, {
    label: strings.ColumnRenderOptionDateIncludeTimeLabel,
    checked: dataTypeProperties.includeTime ?? false,
    onChange: (_, checked) => onChange('includeTime', checked)
  })
]
