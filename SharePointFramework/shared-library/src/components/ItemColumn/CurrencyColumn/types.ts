import { IRenderItemColumnProps } from '../types'

export interface ICurrencyColumnProps extends IRenderItemColumnProps {
  currencyPrefix?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}
