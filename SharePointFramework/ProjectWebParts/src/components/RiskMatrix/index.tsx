import React, { FunctionComponent, useEffect } from 'react'
import { IRiskMatrixProps } from './types'
import { MatrixRows } from './MatrixRow'
import styles from './RiskMatrix.module.scss'
import { Web, } from '@pnp/sp/'
import { PageContext } from '@microsoft/sp-page-context'

export const RiskMatrix: FunctionComponent<IRiskMatrixProps> = ({
  items = [],
  width = 400,
  height = 300,
  calloutTemplate,
  pageContext,
}: IRiskMatrixProps) => {
  const [jsonConfig, setJsonConfig] = React.useState([])

  useEffect(() => {
    async function fetchJson() {
      await fetchJsonConfiguration(pageContext)
    }
    pageContext && fetchJson()
  }, [])

  async function fetchJsonConfiguration(pageContext: PageContext) {
    const web: Web = new Web(pageContext.web.absoluteUrl)
    const { ServerRelativeUrl } = await web.get()
    const json = await web.getFileByServerRelativeUrl(ServerRelativeUrl + '/SiteAssets/custom-cells.txt').getJSON()
    setJsonConfig(json)
  }
  

  return (
    <div className={styles.riskMatrix} style={{ width, height }}>
      <table className={styles.table}>
        <tbody>
          <MatrixRows items={items} calloutTemplate={calloutTemplate} customCells={jsonConfig}/>
        </tbody>
      </table>
    </div>
  )
}


export * from './types'
