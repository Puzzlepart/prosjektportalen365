import { DynamicMatrixContext } from '../context'
import { useContext } from 'react'
import { DynamicMatrixColorScaleConfigItem } from '..'

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
  let lowerCfg: DynamicMatrixColorScaleConfigItem, upperCfg: DynamicMatrixColorScaleConfigItem
  for (let i = 1; i < props.colorScaleConfig.length - 1; i++) {
    lowerCfg = props.colorScaleConfig[i - 1]
    upperCfg = props.colorScaleConfig[i]
    if (percentage < props.colorScaleConfig[i].p) {
      break
    }
  }
  const range = upperCfg.p - lowerCfg.p
  const rangePct = (percentage - lowerCfg.p) / range
  const pctLower = 1 - rangePct
  const pctUpper = rangePct
  const r = Math.floor(lowerCfg.r * pctLower + upperCfg.r * pctUpper)
  const g = Math.floor(lowerCfg.g * pctLower + upperCfg.g * pctUpper)
  const b = Math.floor(lowerCfg.b * pctLower + upperCfg.b * pctUpper)
  return 'rgb(' + [r, g, b].join(',') + ')'
}
