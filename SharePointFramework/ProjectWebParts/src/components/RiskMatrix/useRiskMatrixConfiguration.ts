import { useEffect, useState } from 'react'
import HubSiteService from 'sp-hubsite-service'
import { DynamicMatrixConfiguration } from '../DynamicMatrix'
import { generateMatrixConfiguration } from '../DynamicMatrix/generateMatrixConfiguration'
import { getMatrixHeaders } from './getMatrixHeaders'
import { IRiskMatrixProps } from './types'

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
      const { sp } = await HubSiteService.GetHubSite(props.spfxContext)
      const { ServerRelativeUrl } = await sp.web()
      const jsonConfig_ = await sp.web
        .getFileByServerRelativePath(`/${ServerRelativeUrl}/${props.customConfigUrl}`)
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
