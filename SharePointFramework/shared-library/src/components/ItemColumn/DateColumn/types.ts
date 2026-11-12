import { IRenderItemColumnProps } from '../types'

/**
 * Controls whether a date column includes the time.
 */
export interface IDateColumnProps extends IRenderItemColumnProps {
  includeTime?: boolean
}
