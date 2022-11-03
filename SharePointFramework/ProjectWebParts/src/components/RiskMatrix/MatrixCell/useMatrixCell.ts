import { useContext } from 'react'
import { RiskMatrixContext } from '../context'
import { MatrixColorScaleConfig } from '../types'
import { IMatrixCell } from './types'

/**
 * Component logic hook for `MatrixCell`
 *
 * @param cell Matrix cell
 */
export function useMatrixCell(cell: IMatrixCell) {
  const context = useContext(RiskMatrixContext)
  const riskFactor = cell.consequence * cell.probability
  const numberOfCells = context.size * context.size
  const percentage = Math.floor((riskFactor / numberOfCells) * 100)
  let lower: MatrixColorScaleConfig, upper: MatrixColorScaleConfig
  for (let i = 1; i < context.colorScaleConfig.length - 1; i++) {
    lower = context.colorScaleConfig[i - 1]
    upper = context.colorScaleConfig[i]
    if (percentage < context.colorScaleConfig[i].percentage) {
      break
    }
  }
  const range = upper.percentage - lower.percentage
  const rangePct = (percentage - lower.percentage) / range
  const pctLower = 1 - rangePct
  const pctUpper = rangePct
  const r = Math.floor(lower.color[0] * pctLower + upper.color[0] * pctUpper)
  const g = Math.floor(lower.color[1] * pctLower + upper.color[1] * pctUpper)
  const b = Math.floor(lower.color[2] * pctLower + upper.color[2] * pctUpper)
  const color = [r, g, b]
  return { backgroundColor: 'rgb(' + color.join(',') + ')' } as const
}
