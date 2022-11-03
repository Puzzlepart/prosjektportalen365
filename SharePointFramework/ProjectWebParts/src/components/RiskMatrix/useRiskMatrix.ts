import { useEffect, useState } from 'react'
import { IRiskMatrixProps } from './types'
import { sp } from '@pnp/sp/'
import HubSiteService from 'sp-hubsite-service'

export function useRiskMatrix(props: IRiskMatrixProps) {
  const [cells, setCells] = useState<undefined | []>()

  useEffect(() => {
    if (props.pageContext) {
      fetchJsonConfiguration()
    }
  }, [])

  async function fetchJsonConfiguration() {
    const { web } = await HubSiteService.GetHubSite(sp, props.pageContext as any)
    const { ServerRelativeUrl } = await web.get()
    const jsonConfig_ = await web
      .getFileByServerRelativeUrl(`/${ServerRelativeUrl}/SiteAssets/custom-cells.txt`)
      .getJSON()
      setCells(jsonConfig_)
  }

  return { cells } as const
}
