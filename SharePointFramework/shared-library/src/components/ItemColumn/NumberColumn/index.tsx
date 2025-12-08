import strings from 'PortfolioWebPartsStrings'
import { tryParseInt } from 'pp365-shared-library'
import React from 'react'
import { ColumnRenderComponent } from '../types'

export const NumberColumn: ColumnRenderComponent = (props) => (
  <span>{tryParseInt(props.columnValue, undefined)}</span>
)

NumberColumn.key = 'number'
NumberColumn.id = 'Number'
NumberColumn.displayName = strings.ColumnRenderOptionNumber
NumberColumn.iconName = 'NumberField'
