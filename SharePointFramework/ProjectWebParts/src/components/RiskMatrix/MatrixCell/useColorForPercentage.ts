type RGB = [number, number, number]

export type ColorConfig = { percentage: number, color: RGB }

export const COLOR_CONFIG: ColorConfig[] = [
  { percentage: 0, color: [124, 252, 0] },
  { percentage: 40, color: [255, 255, 0] }, ,
  { percentage: 60, color: [178, 34, 34] },
  { percentage: 80, color: [128, 0, 0] }
]


/**
 * Get color for percentage value based on `COLOR_CONFIG`.
 * 
 * @param percentage Percentage value (0 - 1.0)
 * @returns 
 */
export function useColorForPercentage(percentage: number) {
  let lower: ColorConfig, upper: ColorConfig
  for (let i = 1; i < COLOR_CONFIG.length - 1; i++) {
    lower = COLOR_CONFIG[i - 1]
    upper = COLOR_CONFIG[i]
    if (percentage < COLOR_CONFIG[i].percentage) {
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
  // eslint-disable-next-line no-console
  console.table({
    percentage,
    range,
    rangePct,
    pctLower,
    pctUpper,
    color
  })
  return 'rgb(' + color.join(',') + ')'
}
