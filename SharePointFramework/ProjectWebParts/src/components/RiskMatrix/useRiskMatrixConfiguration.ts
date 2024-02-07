import { dateAdd, getHashCode } from '@pnp/core'
import { Caching } from '@pnp/queryable'
import strings from 'ProjectWebPartsStrings'
import { useEffect, useState } from 'react'
import SPDataAdapter from '../../data'
import { DynamicMatrixConfiguration } from '../DynamicMatrix'
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

  // Fetch manual configuration if `pageContext` is set.
  useEffect(() => {
    if (props.pageContext && !props.useDynamicConfiguration) {
      fetchJsonConfiguration()
    }
  }, [props.pageContext])

  /**
   * Fetches the manual configuration from the specified URL.
   * If the manual configuration is not found or invalid, an error message will be set.
   */
  async function fetchJsonConfiguration() {
    try {
      const manualConfiguration = await SPDataAdapter.portalDataService.web
        .getFileByServerRelativePath(props.manualConfigurationPath)
        .using(
          Caching({
            store: 'local',
            keyFactory: (url) => getHashCode(url.toLowerCase()).toString(),
            expireFunc: () => dateAdd(new Date(), 'minute', 60)
          })
        )
        .getJSON()
      setConfiguration(manualConfiguration)
    } catch {
      setError(strings.ManualConfigurationNotFoundOrInvalid)
    }
  }

  return { configuration, error }
}
