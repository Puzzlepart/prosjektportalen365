import { IMatrixCell } from './MatrixCell'
import { IMatrixElementProps } from './MatrixCell/MatrixElement/types'

export type DynamicMatrixSize = '4' | '5' | '6'
export type DynamicMatrixConfiguration = IMatrixCell[][]
export type DynamicMatrixColorScaleConfigItem = { p: number; r: number; g: number; b: number }
export type DynamicMatrixColorScaleConfig = DynamicMatrixColorScaleConfigItem[]

export interface IDynamicMatrixProps {
  /**
   * Matrix items/elements.
   */
  items?: any[]

  /**
   * Matrix configuration.
   */
  configuration: DynamicMatrixConfiguration

  /**
   * Size (4, 5 or 6)
   */
  size?: string

  /**
   * Width can be either `string` or `number`.
   *
   * For example `100` or `50%`.
   */
  width?: string | number

  /**
   * Template for text to be shown in the callout for the matrix elements.
   */
  calloutTemplate: string

  /**
   * Function that should return the elements for the specified cell.
   */
  getElementsForCell: (cell: IMatrixCell) => IMatrixElementProps[]

  /**
   * Color scale configuration contains color configurations for the matrix.
   */
  colorScaleConfig?: DynamicMatrixColorScaleConfig
}
