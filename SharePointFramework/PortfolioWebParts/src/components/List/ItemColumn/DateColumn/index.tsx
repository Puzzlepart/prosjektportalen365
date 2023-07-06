import { IToggleProps, Toggle } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { IDateColumnProps } from './types'
import { formatDate } from 'pp365-shared-library'

export const DateColumn: ColumnRenderComponent<IDateColumnProps> = (props) => {
  return <span>{formatDate(props.columnValue, props.includeTime)}</span>
}

DateColumn.key = 'date'
DateColumn.id = 'Date'
DateColumn.displayName = strings.ColumnRenderOptionDate
DateColumn.iconName = 'Calendar'
DateColumn.getDataTypeOption = () => ({
  key: DateColumn.key,
  id: DateColumn.id,
  text: DateColumn.displayName,
  data: {
    iconProps: { iconName: DateColumn.iconName },
    getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
      [
        Toggle,
        {
          label: strings.ColumnRenderOptionDateIncludeTimeLabel,
          checked: dataTypeProperties.includeTime ?? false,
          onChange: (_, checked) => onChange('includeTime', checked)
        } as IToggleProps
      ]
    ]
  }
})
