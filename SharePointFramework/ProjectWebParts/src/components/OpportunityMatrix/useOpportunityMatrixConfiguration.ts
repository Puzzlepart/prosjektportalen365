import { useEffect, useState } from 'react'
import { DynamicMatrixConfiguration } from '../DynamicMatrix'
import { generateMatrixConfiguration } from '../DynamicMatrix/generateMatrixConfiguration'
import { IOpportunityMatrixProps, OpportunityMatrixHeaders } from './types'

/**
 * Configuration hook for `OpportunityMatrix`
 *
 * @param props Props
 */
export function useOpportunityMatrixConfiguration(props: IOpportunityMatrixProps) {
  const [configuration, setConfiguration] = useState<DynamicMatrixConfiguration>([])

  useEffect(() => {
    if (props.size) {
      setConfiguration(generateMatrixConfiguration(parseInt(props.size, 10), OpportunityMatrixHeaders))
    }
  }, [props.size])

  return configuration
}
