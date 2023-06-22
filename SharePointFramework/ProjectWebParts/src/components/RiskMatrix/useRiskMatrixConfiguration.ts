import { useEffect, useState } from 'react'
import { DynamicMatrixConfiguration, generateMatrixConfiguration } from '../DynamicMatrix'
import { getMatrixHeaders } from './getMatrixHeaders'
import { IRiskMatrixProps } from './types'
import SPDataAdapter from '../../data'
import strings from 'ProjectWebPartsStrings'

/**
 * Configuration hook for `RiskMatrix`. This hook will fetch the manual configuration
 * from the specified URL or generate a dynamic configuration based on the size of the
 * matrix.
 *
 * @param props Props
 */
export function useRiskMatrixConfiguration(props: IRiskMatrixProps) {
  const [configuration, setConfiguration] = useState<DynamicMatrixConfiguration>([])
  const [error, setError] = useState<string>()

  // Fetch manual configuration if `pageContext` is set and `useDynamicConfiguration` is not set
  useEffect(() => {
    if (props.pageContext && !props.useDynamicConfiguration) {
      fetchJsonConfiguration()
    }
  }, [props.useDynamicConfiguration])

  /**
   * Fetches the manual configuration from the specified URL.
   * If the manual configuration is not found or invalid, an error message will be set.
   */
  async function fetchJsonConfiguration() {
    try {
      const manualConfiguration = await SPDataAdapter.portal.web
        .getFileByServerRelativeUrl(props.manualConfigurationPath)
        .usingCaching()
        .getJSON()
      setConfiguration(manualConfiguration)
    } catch {
      setError(strings.ManualConfigurationNotFoundOrInvalid)
    }
  }

  // Generate dynamic configuration if `size` and `useDynamicConfiguration` is set
  useEffect(() => {
    if (props.size && props.useDynamicConfiguration) {
      setConfiguration(
        generateMatrixConfiguration(parseInt(props.size, 10), getMatrixHeaders(props))
      )
    }
  }, [props.useDynamicConfiguration, props.size])

  return { configuration, error }
}
