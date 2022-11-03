import { useEffect, useState } from 'react'
import { IRiskMatrixProps } from './types'
import { sp } from '@pnp/sp/'
import HubSiteService from 'sp-hubsite-service'
import RISK_MATRIX_CELLS from './RiskMatrixCells_6x6'
import { IMatrixCell } from './MatrixCell'

export function useRiskMatrix(props: IRiskMatrixProps) {
  const [cells, setCells] = useState<IMatrixCell[][]>(RISK_MATRIX_CELLS)

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
        .getFileByServerRelativeUrl(`/${ServerRelativeUrl}/${props.customCellsUrl}`)
        .getJSON()
      setCells(jsonConfig_)
    } catch { }
  }

  return { cells } as const
}
