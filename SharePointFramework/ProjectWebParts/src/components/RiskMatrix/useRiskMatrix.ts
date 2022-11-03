import { CSSProperties } from 'react'
import { pick } from 'underscore'
import { IRiskMatrixProps } from './types'
import { useRiskMatrixConfiguration } from './useRiskMatrixConfiguration'

/**
 * Component logic hook for `RiskMatrix`
 *
 * @param props Props
 */
export function useRiskMatrix(props: IRiskMatrixProps) {
  const { configuration } = useRiskMatrixConfiguration(props)
  const size = parseInt(props.size, 10)
  const style: CSSProperties = pick(props, 'width', 'height')
  return { ctxValue: { ...props, configuration, size }, style } as const
}
