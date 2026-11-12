import { IRenderItemColumnProps } from '../types'

/**
 * Configures the separator and list presentation of a column value.
 */
export interface IListColumnProps extends IRenderItemColumnProps {
  valueSeparator?: string
  listStyleType?: string
  margin?: string | number
  padding?: string | number
}
