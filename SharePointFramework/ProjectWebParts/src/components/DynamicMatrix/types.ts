import { IMatrixCell } from './MatrixCell'
import { IMatrixElementProps } from './MatrixCell/MatrixElement/types'

/** Supported number of probability and consequence levels. */
export type DynamicMatrixSize = '4' | '5' | '6'
/** Matrix rows, including their header cells. */
export type DynamicMatrixConfiguration = IMatrixCell[][]
/** An RGB color stop at position `p` in a matrix color scale. */
export type DynamicMatrixColorScaleConfigItem = { p: number; r: number; g: number; b: number }
/** Color stops used to generate matrix cell backgrounds. */
export type DynamicMatrixColorScaleConfig = DynamicMatrixColorScaleConfigItem[]

/**
 * Width in pixels of a matrix that is not full width and has no width set: the value the
 * property pane's width slider shows until it is moved.
 */
export const DEFAULT_MATRIX_WIDTH = 400

/** Configures matrix layout, cell contents and element tooltips. */
export interface IDynamicMatrixProps {
  items?: any[]

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

  /**
   * The matrix's name for screen readers, the title of the web part it is in.
   */
  title?: string
}
