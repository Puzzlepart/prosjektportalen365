import { IColumn } from '@fluentui/react'
import { RiskElementModel } from 'components/RiskMatrix'
import { getObjectValue as get } from 'pp365-shared/lib/helpers'
import { useContext, useEffect, useState } from 'react'
import { isEmpty } from 'underscore'
import { ProjectStatusContext } from '../../context'
import { SectionContext } from '../context'
import { IUncertaintySectionState } from './types'
import { useFetchListData } from './useFetchListData'

export function useUncertaintySection() {
  const context = useContext(ProjectStatusContext)
  const { section } = useContext(SectionContext)
  const [state, setState] = useState<IUncertaintySectionState>({ isDataLoaded: false, data: {} })
  const fetchListData = useFetchListData()
  const shouldRenderContent =
    (context.state.data.reports
      ? context.state.selectedReport.id === context.state.mostRecentReportId
      : true) && !isEmpty(state.data?.items)

  useEffect(() => {
    fetchListData().then((data) => {
      context.setState({ persistListData: { ...context.state.persistListData, [section.id]: { items: data.items, riskElements: data.riskElements } } })
      setState({ data, isDataLoaded: true })
    })
  }, [])

  return {
    state,
    riskElements: get<RiskElementModel[]>(state, 'data.riskElements', []),
    items: get<any[]>(state, 'data.items', []),
    columns: get<IColumn[]>(state, 'data.columns', []),
    shouldRenderContent
  } as const
}
