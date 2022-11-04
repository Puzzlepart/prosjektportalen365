import { IMatrixCell } from './MatrixCell'
import { IMatrixElementProps } from './MatrixCell/MatrixElement/types'

export type DynamicMatrixSize = '4' | '5' | '6'

export type DynamicMatrixConfiguration = IMatrixCell[][]

type RGB = [number, number, number]

export type DynamicMatrixColorScaleConfig = { percentage?: number; color: RGB }

export interface IDynamicMatrixProps {
  items?: any[]
  configuration: DynamicMatrixConfiguration
  size?: string
  width?: string | number
  calloutTemplate: string
  getElementsForCell: (cell: IMatrixCell) => IMatrixElementProps[]
  colorScaleConfig?: DynamicMatrixColorScaleConfig[]
}
