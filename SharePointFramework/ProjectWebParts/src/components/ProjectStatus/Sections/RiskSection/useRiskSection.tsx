import { IColumn } from '@fluentui/react'
import { RiskElementModel } from 'components/RiskMatrix'
import { getObjectValue as get } from 'pp365-shared/lib/helpers'
import { useContext, useEffect, useState } from 'react'
import { isEmpty } from 'underscore'
import { ProjectStatusContext } from '../../../ProjectStatus/context'
import { IRiskSectionState } from './types'
import { useFetchListData } from './useFetchListData'

export function useRiskSection() {
  const context = useContext(ProjectStatusContext)
  const [state, setState] = useState<IRiskSectionState>({ isDataLoaded: false, data: {} })
  const fetchListData = useFetchListData()
  const shouldRenderContent =
    (context.state.data.reports
      ? context.state.selectedReport.id === context.state.mostRecentReportId
      : true) && !isEmpty(state.data?.items)

  useEffect(() => {
    fetchListData().then((data) => setState({ data, isDataLoaded: true }))
  }, [])

  return {
    state,
    riskElements: get<RiskElementModel[]>(state, 'data.riskElements', []),
    items: get<any[]>(state, 'data.items', []),
    columns: get<IColumn[]>(state, 'data.columns', []),
    shouldRenderContent
  } as const
}
