import { sp } from '@pnp/sp/'
import { generateMatrixConfiguration } from '../DynamicMatrix/generateMatrixConfiguration'
import { useEffect, useState } from 'react'
import HubSiteService from 'sp-hubsite-service'
import { DynamicMatrixConfiguration } from '../DynamicMatrix'
import { IRiskMatrixProps } from './types'
import { getMatrixHeaders } from "./getMatrixHeaders"

/**
 * Configuration hook for `RiskMatrix`
 *
 * @param props Props
 */
export function useRiskMatrixConfiguration(props: IRiskMatrixProps) {
  const [configuration, setConfiguration] = useState<DynamicMatrixConfiguration>([])

  useEffect(() => {
    if (props.pageContext) {
      fetchJsonConfiguration()
    }
  }, [])

  async function fetchJsonConfiguration() {
    try {
      const { web } = await HubSiteService.GetHubSite(sp, props.pageContext as any)
      const { ServerRelativeUrl } = await web.get()
      const jsonConfig_ = await web
        .getFileByServerRelativeUrl(`/${ServerRelativeUrl}/${props.customConfigUrl}`)
        .usingCaching()
        .getJSON()
      setConfiguration(jsonConfig_)
    } catch {}
  }

  useEffect(() => {
    if (props.size) {
      setConfiguration(
        generateMatrixConfiguration(parseInt(props.size, 10), getMatrixHeaders(props))
      )
    }
  }, [props])

  return configuration
}
