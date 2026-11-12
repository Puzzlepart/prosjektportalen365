import strings from 'SharedLibraryStrings'
import { tryParseInt } from '../../../util'
import React from 'react'
import { ColumnRenderComponent } from '../types'

/**
 * Displays a column value parsed as a base-10 integer.
 */
export const NumberColumn: ColumnRenderComponent = (props) => (
  <span>{tryParseInt(props.columnValue, undefined)}</span>
)

NumberColumn.key = 'number'
NumberColumn.id = 'Number'
NumberColumn.displayName = strings.ColumnRenderOptionNumber
NumberColumn.iconName = 'NumberField'
