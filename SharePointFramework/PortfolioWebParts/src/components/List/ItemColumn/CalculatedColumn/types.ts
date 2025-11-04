import { IRenderItemColumnProps } from '../types';

/**
 * Supported result types for a calculated column.
 */
export type ResultType = 'number' | 'currency' | 'boolean' | 'date';

/**
 * Props for the CalculatedColumn renderer.
 * Extends the common column rendering props.
 */
export interface ICalculatedColumnProps extends IRenderItemColumnProps {
  /**
   * Defines how the calculated value should be interpreted and rendered.
   * 
   * @default 'number'
   */
  resultType?: ResultType;
}
