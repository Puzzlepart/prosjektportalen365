import { sp } from '@pnp/sp/'
import { useEffect, useState } from 'react'
import HubSiteService from 'sp-hubsite-service'
import { generateRiskMatrixConfiguration } from './generateRiskMatrixConfiguration'
import { IRiskMatrixProps, RiskMatrixConfiguration } from './types'

/**
 * Configuration hook for `RiskMatrix`
 *
 * @param props Props
 */
export function useRiskMatrixConfiguration(props: IRiskMatrixProps) {
  const [configuration, setConfiguration] = useState<RiskMatrixConfiguration>([])

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
        .getJSON()
      setConfiguration(jsonConfig_)
    } catch {}
  }

  useEffect(() => {
    if (props.size) {
      setConfiguration(generateRiskMatrixConfiguration(parseInt(props.size, 10)))
    }
  }, [props.size])

  return { configuration, setConfiguration } as const
}
