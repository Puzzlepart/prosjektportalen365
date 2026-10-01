import strings from 'SharedLibraryStrings'
import { formatDate } from '../../../util'
import React from 'react'
import { switchField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import { IDateColumnProps } from './types'

export const DateColumn: ColumnRenderComponent<IDateColumnProps> = (props) => {
  return <span>{formatDate(props.columnValue, props.includeTime)}</span>
}

DateColumn.defaultProps = {
  includeTime: false
}

DateColumn.key = 'date'
DateColumn.id = 'Date'
DateColumn.displayName = strings.ColumnRenderOptionDate
DateColumn.iconName = 'Calendar'
DateColumn.getDataTypeProperties = (onChange, dataTypeProperties: Record<string, any>) => [
  switchField({
    label: strings.ColumnRenderOptionDateIncludeTimeLabel,
    checked: dataTypeProperties.includeTime ?? false,
    onChange: (checked) => onChange('includeTime', checked)
  })
]
