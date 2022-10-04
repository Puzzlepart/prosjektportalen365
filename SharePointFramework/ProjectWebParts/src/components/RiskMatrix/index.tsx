import React, { FunctionComponent, useEffect } from 'react'
import { IRiskMatrixProps } from './types'
import { MatrixRows } from './MatrixRow'
import styles from './RiskMatrix.module.scss'
import { sp } from '@pnp/sp/'
import HubSiteService from 'sp-hubsite-service'

export const RiskMatrix: FunctionComponent<IRiskMatrixProps> = ({
  items = [],
  width = 400,
  height = 300,
  calloutTemplate,
  pageContext
}: IRiskMatrixProps) => {
  const [jsonConfig, setJsonConfig] = React.useState<undefined | []>()

  useEffect(() => {
    async function fetchJson() {
      await fetchJsonConfiguration()
    }
    pageContext && fetchJson()
  }, [])

  async function fetchJsonConfiguration() {
    const hubSite = await HubSiteService.GetHubSite(sp, pageContext as any)
    const { ServerRelativeUrl } = await hubSite.web.get()
    const json = await hubSite.web
      .getFileByServerRelativeUrl(`/${ServerRelativeUrl}/SiteAssets/custom-cells.txt`)
      .getJSON()
    setJsonConfig(json)
  }

  return (
    <div className={styles.riskMatrix} style={{ width, height }}>
      <table className={styles.table}>
        <tbody>
          <MatrixRows items={items} calloutTemplate={calloutTemplate} customCells={jsonConfig} />
        </tbody>
      </table>
    </div>
  )
}

export * from './types'
