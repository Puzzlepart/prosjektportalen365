import { sp } from '@pnp/sp/'
import { CSSProperties, useEffect, useState } from 'react'
import HubSiteService from 'sp-hubsite-service'
import { pick } from 'underscore'
import RISK_MATRIX_CELLS from './RiskMatrixCells'
import { IRiskMatrixProps, RiskMatrixConfiguration } from './types'

export function useRiskMatrix(props: IRiskMatrixProps) {
  const [configuration, setConfiguration] = useState<RiskMatrixConfiguration>(RISK_MATRIX_CELLS)

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

  const style: CSSProperties = pick(props, 'width', 'height')

  return { configuration, style } as const
}
