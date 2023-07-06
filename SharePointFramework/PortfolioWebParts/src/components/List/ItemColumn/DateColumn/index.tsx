import { IToggleProps, Toggle } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { IDateColumnProps } from './types'
import { formatDate } from 'pp365-shared-library'
import { IColumnDataTypePropertyField } from '../ColumnDataTypeField'
import { ColumnRenderComponentRegistry } from '../registry'

export const DateColumn: ColumnRenderComponent<IDateColumnProps> = (props) => {
  return <span>{formatDate(props.columnValue, props.includeTime)}</span>
}

DateColumn.key = 'date'
DateColumn.id = 'Date'
DateColumn.displayName = strings.ColumnRenderOptionDate
DateColumn.iconName = 'Calendar'
ColumnRenderComponentRegistry.register(
  DateColumn,
  (onChange, dataTypeProperties: Record<string, any>) => [
    {
      type: Toggle,
      props: {
        label: strings.ColumnRenderOptionDateIncludeTimeLabel,
        checked: dataTypeProperties.includeTime ?? false,
        onChange: (_, checked) => onChange('includeTime', checked)
      }
    } as IColumnDataTypePropertyField<IToggleProps>
  ]
)
