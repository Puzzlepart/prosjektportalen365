import { IRenderItemColumnProps } from '../types'

/**
 * Configures the labels used to display Boolean column values.
 */
export interface IBooleanColumnProps extends IRenderItemColumnProps {
  valueIfTrue?: string
  valueIfFalse?: string
}
