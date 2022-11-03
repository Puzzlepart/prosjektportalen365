import { createContext } from 'react'
import { IMatrixCell, DynamicMatrixColorScaleConfig, DynamicMatrixConfiguration } from '.'
import { IMatrixElementProps } from './MatrixCell/MatrixElement/types'

export interface IDynamicMatrixContext {
  items?: any[]
  configuration: DynamicMatrixConfiguration
  size?: string
  width?: string | number
  calloutTemplate: string
  getElementsForCell: (cell: IMatrixCell) => IMatrixElementProps[]
  colorScaleConfig?: DynamicMatrixColorScaleConfig[]
}

export const DynamicMatrixContext = createContext<IDynamicMatrixContext>(null)
