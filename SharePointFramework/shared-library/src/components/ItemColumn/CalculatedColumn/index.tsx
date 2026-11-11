import React, { FC, useMemo } from 'react'
import { ColumnRenderComponent } from '../types'
import { ICalculatedColumnProps, ResultType } from './types'
import { tryParseCalculated, withDefaults } from '../../../util'
import { NumberColumn } from '../NumberColumn'
import { CurrencyColumn } from '../CurrencyColumn'
import { BooleanColumn } from '../BooleanColumn'
import { DateColumn } from '../DateColumn'
import strings from 'SharedLibraryStrings'

const componentRegistry: Record<ResultType, FC<ICalculatedColumnProps>> = {
  currency: CurrencyColumn,
  boolean: BooleanColumn,
  date: DateColumn,
  number: NumberColumn
}

const CALCULATED_COLUMN_DEFAULT_PROPS: Partial<ICalculatedColumnProps> = {
  resultType: 'number'
}

export const CalculatedColumn: ColumnRenderComponent<ICalculatedColumnProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, CALCULATED_COLUMN_DEFAULT_PROPS)
  const { columnValue, resultType } = props
  const parsedValue = useMemo(() => tryParseCalculated(columnValue, ''), [columnValue])
  const Component = componentRegistry[resultType] ?? NumberColumn
  const commonProps = { ...props, columnValue: parsedValue }
  return <Component {...commonProps} />
}

CalculatedColumn.key = 'calculated'
CalculatedColumn.id = 'Calculated'
CalculatedColumn.displayName = strings.ColumnRenderOptionCalculated
CalculatedColumn.iconName = 'Calculator'
