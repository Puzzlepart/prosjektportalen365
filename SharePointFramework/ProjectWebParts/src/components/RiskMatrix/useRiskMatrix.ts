import { sp } from '@pnp/sp/'
import { CSSProperties, useEffect, useState } from 'react'
import HubSiteService from 'sp-hubsite-service'
import { pick } from 'underscore'
import { generateRiskMatrixConfiguration } from './RiskMatrixCells'
import { IRiskMatrixProps, RiskMatrixConfiguration } from './types'

/**
 * Component logic hook for `RiskMatrix`
 *
 * @param props Props
 */
export function useRiskMatrix(props: IRiskMatrixProps) {
  const [configuration, setConfiguration] = useState<RiskMatrixConfiguration>([])
  const size = parseInt(props.size, 10)

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
    } catch { }
  }

  useEffect(() => {
    if (props.size) {
      setConfiguration(generateRiskMatrixConfiguration(size))
    }
  }, [props.size])

  const style: CSSProperties = pick(props, 'width', 'height')

  return { ctxValue: { ...props, configuration, size }, style } as const
}
