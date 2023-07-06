import _ from 'lodash'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { IListColumnProps } from './types'

export const ListColumn: ColumnRenderComponent<IListColumnProps> = (props) => {
  const values: string[] = props.columnValue ? props.columnValue.split(props.valueSeparator) : []
  if (_.isEmpty(values)) return null
  return (
    <ul
      style={{ listStyleType: props.listStyleType, margin: props.margin, padding: props.padding }}
    >
      {values.map((v, idx) => (
        <li key={idx}>{v}</li>
      ))}
    </ul>
  )
}

ListColumn.defaultProps = {
  valueSeparator: ';#',
  listStyleType: 'none',
  margin: 0,
  padding: 0
}
ListColumn.key = 'list'
ListColumn.id = 'List'
ListColumn.displayName = 'List'
ListColumn.iconName = 'List'
ListColumn.getDataTypeOption = () => ({
  key: ListColumn.key,
  id: ListColumn.id,
  text: ListColumn.displayName,
  data: {
    iconProps: { iconName: ListColumn.iconName }
  }
})
