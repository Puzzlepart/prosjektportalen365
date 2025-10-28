import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'

export const NoteColumn: ColumnRenderComponent = (props) => {
  const value = props.columnValue && typeof props.columnValue === 'string'
    ? props.columnValue.replace(/<[^>]*>/g, '')
    : ''
  return <span>{value}</span>
}

NoteColumn.key = 'note'
NoteColumn.id = 'Note'
NoteColumn.displayName = strings.ColumnRenderOptionNote
NoteColumn.iconName = 'EditStyle'
