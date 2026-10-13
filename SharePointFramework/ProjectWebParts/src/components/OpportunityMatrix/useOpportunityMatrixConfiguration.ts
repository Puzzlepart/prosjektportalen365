import { dateAdd, getHashCode } from '@pnp/core'
import { Caching } from '@pnp/queryable'
import strings from 'ProjectWebPartsStrings'
import { useEffect, useState } from 'react'
import SPDataAdapter from '../../data'
import { DynamicMatrixConfiguration } from '../DynamicMatrix'
import { IOpportunityMatrixProps } from './types'

/**
 * Reads the matrix configuration, a JSON file in the hub, cached for an hour. Async, so that a
 * missing hub (no `portalDataService`) rejects like a missing file.
 *
 * @param path Server relative path of the configuration file
 */
async function fetchJsonConfiguration(path: string): Promise<DynamicMatrixConfiguration> {
  return await SPDataAdapter.portalDataService.web
    .getFileByServerRelativePath(path)
    .using(
      Caching({
        store: 'local',
        keyFactory: (url) => getHashCode(url.toLowerCase()).toString(),
        expireFunc: () => dateAdd(new Date(), 'minute', 60)
      })
    )
    .getJSON()
}

/**
 * Configuration hook for `OpportunityMatrix`. Fetches the manual configuration from
 * `manualConfigurationPath` once `pageContext` is set, and again when another configuration is
 * chosen. If the configuration is not found or invalid, an error message is set; a configuration
 * read later clears it.
 *
 * @param props Props
 */
export function useOpportunityMatrixConfiguration(props: IOpportunityMatrixProps) {
  const [configuration, setConfiguration] = useState<DynamicMatrixConfiguration>([])
  const [error, setError] = useState<string>()

  useEffect(() => {
    // Only the configuration chosen last is applied, whichever request answers first.
    let isCurrent = true
    if (props.pageContext) {
      fetchJsonConfiguration(props.manualConfigurationPath)
        .then((manualConfiguration) => {
          if (!isCurrent) return
          setConfiguration(manualConfiguration)
          setError(undefined)
        })
        .catch(() => {
          if (isCurrent) setError(strings.ManualConfigurationNotFoundOrInvalid)
        })
    }
    return () => {
      isCurrent = false
    }
  }, [props.pageContext, props.manualConfigurationPath])

  return { configuration, error }
}
