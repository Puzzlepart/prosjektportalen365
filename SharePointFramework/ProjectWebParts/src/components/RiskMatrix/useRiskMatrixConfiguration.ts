import SPDataAdapter from '../../data'
import { useEffect, useState } from 'react'
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
      const { ServerRelativeUrl } = await SPDataAdapter.portal.web.get()
      const jsonConfig_ = await SPDataAdapter.portal.web
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
