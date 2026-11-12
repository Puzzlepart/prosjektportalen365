import { createContext } from 'react'
import { IDynamicMatrixProps } from '.'

/** Tooltip configuration shared with matrix elements. */
export interface IDynamicMatrixContext {
  props: IDynamicMatrixProps
}

/** Shares the matrix's callout template with its elements. */
export const DynamicMatrixContext = createContext<IDynamicMatrixContext>(null)
