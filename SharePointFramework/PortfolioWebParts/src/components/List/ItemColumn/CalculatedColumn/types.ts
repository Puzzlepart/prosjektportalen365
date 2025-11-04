import { IRenderItemColumnProps } from '../types'

export interface ICalculatedColumnProps extends IRenderItemColumnProps {
  /**
   * The result type of the calculated column
   */
  resultType?: 'number' | 'currency' | 'boolean' | 'date'
  
  /**
   * Whether to include time in date formatting
   */
  includeTime?: boolean
}