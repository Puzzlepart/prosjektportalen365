type RGB = [number, number, number]

export type ColorScaleConfig = { percentage: number, color: RGB }

export const COLOR_SCALE_CONFIG: ColorScaleConfig[] = [
  { percentage: 10, color: [44, 186, 0] },
  { percentage: 30, color: [163, 255, 0] },
  { percentage: 50, color: [255, 244, 0] },
  { percentage: 70, color: [255, 167, 0] },
  { percentage: 90, color: [255, 0, 0] }
]

/**
 * Get color for percentage value based on `colorConfig`.
 * 
 * @param percentage Percentage value (0 - 1.0)
 * @param colorConfig Color scale configuration
 */
export function useColorForPercentage(percentage: number, colorConfig = COLOR_SCALE_CONFIG) {
  let lower: ColorScaleConfig, upper: ColorScaleConfig
  for (let i = 1; i < colorConfig.length - 1; i++) {
    lower = colorConfig[i - 1]
    upper = colorConfig[i]
    if (percentage < colorConfig[i].percentage) {
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
