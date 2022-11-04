import { DynamicMatrixContext } from '../context'
import { useContext } from 'react'
import { DynamicMatrixColorScaleConfig } from '..'

/**
 * Hook for getting color for cell based on color scale specified in
 * `context.props.colorScaleConfig`.
 *
 * @param cellValue Cell value
 * @param size Matrix size
 */
export function useMatrixCellColor(cellValue: number, size: number) {
  const { props } = useContext(DynamicMatrixContext)
  const percentage = Math.floor((cellValue / (size * size)) * 100)
  let lowerCfg: DynamicMatrixColorScaleConfig, upperCfg: DynamicMatrixColorScaleConfig
  for (let i = 1; i < props.colorScaleConfig.length - 1; i++) {
    lowerCfg = props.colorScaleConfig[i - 1]
    upperCfg = props.colorScaleConfig[i]
    if (percentage < props.colorScaleConfig[i][0]) {
      break
    }
  }
  const [uPct, uR, uG, uB] = upperCfg
  const [lPct, lR, lG, lB] = lowerCfg
  const range = uPct - lPct
  const rangePct = (percentage - lPct) / range
  const pctLower = 1 - rangePct
  const pctUpper = rangePct
  const r = Math.floor(lR * pctLower + uR * pctUpper)
  const g = Math.floor(lG * pctLower + uG * pctUpper)
  const b = Math.floor(lB * pctLower + uB * pctUpper)
  return 'rgb(' + [r, g, b].join(',') + ')'
}
