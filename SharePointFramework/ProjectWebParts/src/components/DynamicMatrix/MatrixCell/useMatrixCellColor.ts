import { DynamicMatrixContext } from '../context'
import { useContext } from 'react'
import { DynamicMatrixColorScaleConfigItem, IMatrixCell } from '..'

/**
 * Hook for getting color for cell based on color scale specified in
 * `context.props.colorScaleConfig`.
 *
 * @param cell Matrix cell
 * @param size Matrix size
 */
export function useMatrixCellColor(cell: IMatrixCell, size: number) {
  const { props } = useContext(DynamicMatrixContext)
  if (cell.backgroundColor) return cell.backgroundColor
  const percentage = Math.floor(((cell.x * cell.y) / (size * size)) * 100)
  let lowerCfg: DynamicMatrixColorScaleConfigItem,
    upperCfg: DynamicMatrixColorScaleConfigItem
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
