import { createContext } from 'react'
import { IMatrixCell } from './MatrixCell/types'
import { RiskElementModel } from './types'

export interface IRiskMatrixContext {
    items?: RiskElementModel[]
    calloutTemplate: string
    cells: IMatrixCell[][]
}

export const RiskMatrixContext = createContext<IRiskMatrixContext>(null)