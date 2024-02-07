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
  configuration?: DynamicMatrixConfiguration

  /**
   * Size (4, 5 or 6) as string.
   */
  size?: DynamicMatrixSize

  /**
   * Whether the matrix should be full width
   */
  fullWidth?: boolean

  /**
   * Width can be either `string` or `number`.
   *
   * For example `100` or `50%`.
   */
  width?: string | number

  /**
   * Template for text to be shown in the callout for the matrix elements.
   */
  calloutTemplate?: string

  /**
   * Function that should return the elements for the specified cell.
   */
  getElementsForCell?: (cell: IMatrixCell) => IMatrixElementProps[]

  /**
   * Manual configuration URL. File must be a JSON file stored in SharePoint.
   */
  manualConfigurationPath?: string
}
