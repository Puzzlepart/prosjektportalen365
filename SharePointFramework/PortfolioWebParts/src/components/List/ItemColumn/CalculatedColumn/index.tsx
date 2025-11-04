import strings from 'PortfolioWebPartsStrings'
import { tryParseCalculated } from 'pp365-shared-library'
import React, { useMemo } from 'react'
import { BooleanColumn } from '../BooleanColumn'
import { CurrencyColumn } from '../CurrencyColumn'
import { DateColumn } from '../DateColumn'
import { NumberColumn } from '../NumberColumn'
import { ColumnRenderComponent } from '../types'
import { ICalculatedColumnProps } from './types'

export const CalculatedColumn: ColumnRenderComponent<ICalculatedColumnProps> = (props) => {
  const { columnValue, resultType, includeTime } = props
  const parsedValue = useMemo(() => tryParseCalculated(columnValue, ''), [columnValue])
  const commonProps = { ...props, columnValue: parsedValue }

  switch (resultType) {
    case 'currency':
      return <CurrencyColumn {...commonProps} />

    case 'boolean':
      return <BooleanColumn {...commonProps} />

    case 'date':
      return <DateColumn {...commonProps} includeTime={includeTime} />

    case 'number':
    default:
      return <NumberColumn {...commonProps} />
  }
}

CalculatedColumn.defaultProps = {
  resultType: 'number',
  includeTime: false
}

CalculatedColumn.key = 'calculated'
CalculatedColumn.id = 'Calculated'
CalculatedColumn.displayName = strings.ColumnRenderOptionCalculated
CalculatedColumn.iconName = 'Calculator'
