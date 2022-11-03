import { useContext } from 'react'
import { RiskMatrixContext } from '../context'
import { IMatrixCellProps } from './types'
import { useColorForPercentage } from './useColorForPercentage'

/**
 * Componet logic hook for `MatrixCell`
 * 
 * @param props Props
 */
export function useMatrixCell(props: IMatrixCellProps) {
  const context = useContext(RiskMatrixContext)
  const riskFactor = (props.cell.consequence * props.cell.probability)
  const numberOfCells = (context.size * context.size)
  const color = useColorForPercentage( (riskFactor / numberOfCells) * 100)
  return { color } as const
}
