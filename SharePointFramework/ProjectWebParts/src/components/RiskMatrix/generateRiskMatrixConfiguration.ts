// import * as strings from 'ProjectWebPartsStrings'
// import { DynamicMatrixConfiguration, IMatrixCell, MatrixCellType } from '../DynamicMatrix'

// /**
//  * Generate risk matrix configuration
//  *
//  * @param size Matrix size
//  */
// export const generateRiskMatrixConfiguration = (size: number): DynamicMatrixConfiguration => {
//   const [topHeaders, leftHeaders] = RiskMatrixHeaders[size]
//   const firstRow = topHeaders.map<IMatrixCell>((cellValue) => ({
//     cellValue,
//     cellType: MatrixCellType.Header,
//   }))
//   const configuration = [firstRow]
//   for (let i = 0; i < size; i++) {
//     const row: IMatrixCell[] = [
//       {
//         cellValue: leftHeaders[i],
//         cellType: MatrixCellType.Header,
//         className: 'risk-header'
//       }
//     ]
//     for (let consequence = 1; consequence <= size; consequence++) {
//       row.push({
//         cellType: MatrixCellType.Cell,
//         x: consequence,
//         y: size - i
//       })
//     }
//     configuration.push(row)
//   }
//   return configuration
// }
