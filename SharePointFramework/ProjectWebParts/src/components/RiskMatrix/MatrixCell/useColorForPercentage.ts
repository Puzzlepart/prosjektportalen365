import { useContext } from 'react'
import { RiskMatrixContext } from '../context'
import { MatrixColorScaleConfig } from '../types'

/**
 * Get color for percentage value based on `colorConfig`.
 *
 * @param percentage Percentage value (0 - 1.0)
 */
export function useColorForPercentage(
  percentage: number
) {
  const context = useContext(RiskMatrixContext)
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
  const color = [
    Math.floor(lower.color[0] * pctLower + upper.color[0] * pctUpper),
    Math.floor(lower.color[1] * pctLower + upper.color[1] * pctUpper),
    Math.floor(lower.color[2] * pctLower + upper.color[2] * pctUpper)
  ]
  return 'rgb(' + color.join(',') + ')'
}
