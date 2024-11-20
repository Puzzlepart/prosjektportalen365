import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'

export const NoteColumn: ColumnRenderComponent = (props) => (
  <span>{props.columnValue?.replace(/<[^>]*>/g, '')}</span>
)

NoteColumn.key = 'note'
NoteColumn.id = 'Note'
NoteColumn.displayName = strings.ColumnRenderOptionNote
NoteColumn.iconName = 'EditStyle'
