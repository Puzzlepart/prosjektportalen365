import { createContext } from 'react'
import { IDynamicMatrixProps } from '.'

export interface IDynamicMatrixContext {
  props: IDynamicMatrixProps
}

export const DynamicMatrixContext = createContext<IDynamicMatrixContext>(null)
