import React, { FC } from 'react'
import { IBooleanColumnProps } from './types'
import strings from 'PortfolioWebPartsStrings'

export const BooleanColumn: FC<IBooleanColumnProps> = (props) => {
  const displayValue = parseInt(props.columnValue) === 1 ? props.valueIfTrue : props.valueIfFalse
  return <span>{displayValue}</span>
}

BooleanColumn.defaultProps = {
  valueIfTrue: strings.BooleanYes,
  valueIfFalse: strings.BooleanNo
}
