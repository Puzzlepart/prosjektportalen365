import { IMatrixCell, MatrixCellType } from './MatrixCell'
import { DynamicMatrixConfiguration } from './types'

/** Builds matrix rows with column headers first and descending probability levels. */
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
