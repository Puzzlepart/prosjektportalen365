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
  const cellValue = cell.x * cell.y
  const backgroundColor = useMatrixCellColor(cellValue, parseInt(props.size, 10))
  return { backgroundColor } as const
}