import { useContext } from 'react'
import { RiskMatrixContext } from '../context'
import { IMatrixCellProps } from './types'
import { useColorForPercentage } from './useColorForPercentage'


export function useMatrixCell(props: IMatrixCellProps) {
  const context = useContext(RiskMatrixContext)
  const riskValue = (props.cell.consequence * props.cell.probability)
  const numberOfCells = (context.size * context.size)
  const percentage = (riskValue / numberOfCells) * 100
  const color = useColorForPercentage(percentage)
  return { color } as const
}
