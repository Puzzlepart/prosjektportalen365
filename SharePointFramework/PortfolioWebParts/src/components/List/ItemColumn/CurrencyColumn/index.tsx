import React, { FC } from 'react'
import { ICurrencyColumnProps } from './types'
import { tryParseCurrency } from 'pp365-shared-library'

export const CurrencyColumn: FC<ICurrencyColumnProps> = (props) => {
  return (
    <span>
      {tryParseCurrency(
        props.columnValue,
        undefined,
        props.currencyPrefix,
        props.minimumFractionDigits,
        props.maximumFractionDigits
      )}
    </span>
  )
}

CurrencyColumn.defaultProps = {
  currencyPrefix: 'kr',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}
