import { IMatrixCell, MatrixCellType } from './MatrixCell'
import { DynamicMatrixConfiguration } from './types'

/**
 * Generate matrix configuration for `DynamicMatix` with the specified `size``
 * and headers specified `headerConfig`. `headerConfig` should contain two
 * arrays. First array is the top headers and the second is left headers.
 *
 * @param size Matrix size
 * @param headerConfig Header configuration
 */
export const generateMatrixConfiguration = (
  size: number,
  headerConfig: Record<number, string[][]>
): DynamicMatrixConfiguration => {
  const [topHeaders, leftHeaders] = headerConfig[size]
  const firstRow = topHeaders.map<IMatrixCell>((cellValue) => ({
    cellValue,
    cellType: MatrixCellType.Header
  }))
  const configuration = [firstRow]
  for (let i = 0; i < size; i++) {
    const row: IMatrixCell[] = [
      {
        cellValue: leftHeaders[i],
        cellType: MatrixCellType.Header
      }
    ]
    for (let x = 1; x <= size; x++) {
      row.push({
        cellType: MatrixCellType.Cell,
        x: x,
        y: size - i
      })
    }
    configuration.push(row)
  }
  return configuration
}
