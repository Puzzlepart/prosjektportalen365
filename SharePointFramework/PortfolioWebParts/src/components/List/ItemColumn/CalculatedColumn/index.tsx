import strings from 'PortfolioWebPartsStrings'
import { tryParseCalculated } from 'pp365-shared-library'
import React, { FC, useMemo } from 'react'
import { BooleanColumn } from '../BooleanColumn'
import { CurrencyColumn } from '../CurrencyColumn'
import { DateColumn } from '../DateColumn'
import { NumberColumn } from '../NumberColumn'
import { ColumnRenderComponent } from '../types'
import { ICalculatedColumnProps, ResultType } from './types'

const componentRegistry: Record<ResultType, FC<ICalculatedColumnProps>> = {
  currency: CurrencyColumn,
  boolean: BooleanColumn,
  date: DateColumn,
  number: NumberColumn
}

export const CalculatedColumn: ColumnRenderComponent<ICalculatedColumnProps> = (props) => {
  const { columnValue, resultType } = props
  const parsedValue = useMemo(() => tryParseCalculated(columnValue, ''), [columnValue])
  const Component = componentRegistry[resultType] ?? NumberColumn
  const commonProps = { ...props, columnValue: parsedValue }
  return <Component {...commonProps} />
}

CalculatedColumn.defaultProps = {
  resultType: 'number'
}

CalculatedColumn.key = 'calculated'
CalculatedColumn.id = 'Calculated'
CalculatedColumn.displayName = strings.ColumnRenderOptionCalculated
CalculatedColumn.iconName = 'Calculator'
