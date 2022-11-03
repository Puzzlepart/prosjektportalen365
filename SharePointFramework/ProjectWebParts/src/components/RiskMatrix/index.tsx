import React, { FC, useEffect, useState } from 'react'
import { IRiskMatrixProps } from './types'
import { MatrixRows } from './MatrixRows'
import styles from './RiskMatrix.module.scss'
import { sp } from '@pnp/sp/'
import HubSiteService from 'sp-hubsite-service'
import { pick } from 'underscore'

export const RiskMatrix: FC<IRiskMatrixProps> = (props) => {
  const [jsonConfig, setJsonConfig] = useState<undefined | []>()

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
    setJsonConfig(jsonConfig_)
  }

  return (
    <div className={styles.riskMatrix} style={pick(props, 'width', 'height')}>
      <table className={styles.table}>
        <tbody>
          <MatrixRows
            items={props.items}
            calloutTemplate={props.calloutTemplate}
            cells={jsonConfig}
          />
        </tbody>
      </table>
    </div>
  )
}

RiskMatrix.defaultProps = {
  items: [],
  width: 400,
  height: 300
}

export * from './types'
