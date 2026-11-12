import { IRenderItemColumnProps } from '../types'

/**
 * Configures the prefix and decimal precision of currency values.
 */
export interface ICurrencyColumnProps extends IRenderItemColumnProps {
  currencyPrefix?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}
