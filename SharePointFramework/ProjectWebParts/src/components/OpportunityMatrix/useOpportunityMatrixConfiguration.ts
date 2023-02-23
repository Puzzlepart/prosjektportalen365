import { useEffect, useState } from 'react'
import { DynamicMatrixConfiguration } from '../DynamicMatrix'
import { generateMatrixConfiguration } from '../DynamicMatrix/generateMatrixConfiguration'
import { IOpportunityMatrixProps } from './types'
import { getMatrixHeaders } from './getMatrixHeaders'

/**
 * Configuration hook for `OpportunityMatrix`. Generates the matrix configuration based on the
 * specified matrix size.
 *
 * @param props Props
 */
export function useOpportunityMatrixConfiguration(props: IOpportunityMatrixProps) {
  const [configuration, setConfiguration] = useState<DynamicMatrixConfiguration>([])

  useEffect(() => {
    if (props.size) {
      const matrixHeaders = getMatrixHeaders(props)
      setConfiguration(generateMatrixConfiguration(parseInt(props.size, 10), matrixHeaders))
    }
  }, [props])

  return configuration
}
