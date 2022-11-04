import { DynamicMatrixContext } from '../context'
import { useContext } from 'react'
import { IMatrixCell } from './types'
import { useMatrixCellColor } from './useMatrixCellColor'

/**
 * Component logic hook for `MatrixCell`
 *
 * @param cell Matrix cell
 */
export function useMatrixCell(cell: IMatrixCell) {
  const { props } = useContext(DynamicMatrixContext)
  const size = parseInt(props.size, 10)
  const riskFactor = cell.x * cell.y
  const numberOfCells = size * size
  const backgroundColor = useMatrixCellColor(riskFactor, numberOfCells)
  return { backgroundColor } as const
}
