import strings from 'PortfolioWebPartsStrings'
import { tryParsePercentage } from 'pp365-shared-library'
import React from 'react'
import { ColumnRenderComponent } from '../types'

export const PercentageColumn: ColumnRenderComponent = (props) => (
  <span>{tryParsePercentage(props.columnValue, true, 0)}</span>
)

PercentageColumn.key = 'percentage'
PercentageColumn.id = 'Percentage'
PercentageColumn.displayName = strings.ColumnRenderOptionPercentage
PercentageColumn.iconName = 'CalculatorPercentage'
