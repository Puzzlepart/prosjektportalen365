import React, { FC } from 'react'
import { IListColumnProps } from './types'
import _ from 'lodash'

export const ListColumn: FC<IListColumnProps> = (props) => {
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
