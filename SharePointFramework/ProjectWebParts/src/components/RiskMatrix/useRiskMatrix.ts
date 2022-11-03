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
  return { ctxValue: { ...props, configuration, size } } as const
}
