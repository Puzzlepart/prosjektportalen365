import strings from 'SharedLibraryStrings'
import { tryParsePercentage } from '../../../util'
import React from 'react'
import { ColumnRenderComponent } from '../types'

/**
 * A share of one as a percentage with at most two decimals and no trailing zeros («0.125» is
 * «12.5%»), or nothing for an empty value. Rounded, since a share times 100 is not always exact:
 * «0.07» showed «7.000000000000001%».
 *
 * @param value The share of one, as search gives it
 */
function formatPercentage(value: string): string {
  const percentage = tryParsePercentage(value, false, '')
  return percentage === '' ? '' : `${Math.round((percentage as number) * 100) / 100}%`
}

/**
 * A share of one as a percentage: «0.5» is «50%», «0» is «0%». An empty cell shows nothing, where
 * it showed «0» without the sign.
 */
export const PercentageColumn: ColumnRenderComponent = (props) => (
  <span>{formatPercentage(props.columnValue)}</span>
)

PercentageColumn.key = 'percentage'
PercentageColumn.id = 'Percentage'
PercentageColumn.displayName = strings.ColumnRenderOptionPercentage
PercentageColumn.iconName = 'CalculatorPercentage'
