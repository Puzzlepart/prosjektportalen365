import * as strings from 'ProjectWebPartsStrings'
import { IMatrixCell, MatrixCellType } from './MatrixCell'
import { RiskMatrixConfiguration } from './types'

const RiskMatrixHeaders: Record<number, string[][]> = {
  4: [
    [
      undefined,
      strings.RiskMatrix_Header_Insignificant,
      strings.RiskMatrix_Header_Small,
      strings.RiskMatrix_Header_Moderate,
      strings.RiskMatrix_Header_Serious
    ],
    [
      strings.RiskMatrix_Header_VeryHigh,
      strings.RiskMatrix_Header_High,
      strings.RiskMatrix_Header_Medium,
      strings.RiskMatrix_Header_Low
    ]
  ],
  5: [
    [
      undefined,
      strings.RiskMatrix_Header_Insignificant,
      strings.RiskMatrix_Header_Small,
      strings.RiskMatrix_Header_Moderate,
      strings.RiskMatrix_Header_Serious,
      strings.RiskMatrix_Header_Critical
    ],
    [
      strings.RiskMatrix_Header_VeryHigh,
      strings.RiskMatrix_Header_High,
      strings.RiskMatrix_Header_Medium,
      strings.RiskMatrix_Header_Low,
      strings.RiskMatrix_Header_VeryLow
    ]
  ],
  6: [
    [
      undefined,
      strings.RiskMatrix_Header_Insignificant,
      strings.RiskMatrix_Header_Small,
      strings.RiskMatrix_Header_Moderate,
      strings.RiskMatrix_Header_Serious,
      strings.RiskMatrix_Header_Critical,
      strings.RiskMatrix_Header_Critical
    ],
    [
      strings.RiskMatrix_Header_VeryHigh,
      strings.RiskMatrix_Header_High,
      strings.RiskMatrix_Header_Medium,
      strings.RiskMatrix_Header_Low,
      strings.RiskMatrix_Header_VeryLow,
      strings.RiskMatrix_Header_VeryLow
    ]
  ]
}

/**
 * Generate default risk matrix configuration
 *
 * @param size Matrix size
 */
export const generateRiskMatrixConfiguration = (size: number): RiskMatrixConfiguration => {
  const [topHeaders, leftHeaders] = RiskMatrixHeaders[size]
  const firstRow = topHeaders.map<IMatrixCell>((cellValue) => ({
    cellValue,
    cellType: MatrixCellType.Header,
    className: 'risk-header'
  }))
  const configuration = [firstRow]
  for (let i = 0; i < size; i++) {
    const row: IMatrixCell[] = [
      {
        cellValue: leftHeaders[i],
        cellType: MatrixCellType.Header,
        className: 'risk-header'
      }
    ]
    for (let consequence = 1; consequence <= size; consequence++) {
      row.push({
        cellType: MatrixCellType.Cell,
        className: 'risk-matrix-cell',
        consequence,
        probability: size - i
      })
    }
    configuration.push(row)
  }
  return configuration
}
