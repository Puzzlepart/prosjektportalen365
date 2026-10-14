import _ from 'lodash'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { IListColumnProps } from './types'
import { withDefaults } from '../../../util'

const LIST_COLUMN_DEFAULT_PROPS: Partial<IListColumnProps> = {
  valueSeparator: ';#',
  listStyleType: 'none',
  margin: 0,
  padding: 0
}

export const ListColumn: ColumnRenderComponent<IListColumnProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, LIST_COLUMN_DEFAULT_PROPS)
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
ListColumn.key = 'list'
ListColumn.id = 'List'
ListColumn.displayName = 'List'
ListColumn.iconName = 'List'
