import { ProjectStatusContext } from '../../../ProjectStatus/context'
import { useContext, useEffect, useState } from 'react'
import { isEmpty } from 'underscore'
import { IListSectionData, IListSectionState } from './types'
import { useFetchListData } from './useFetchListData'
import { getObjectValue as get } from 'pp365-shared/lib/helpers'
import { IColumn } from '@fluentui/react'
import { SectionContext } from '../context'

export function useListSection() {
  const context = useContext(ProjectStatusContext)
  const { section } = useContext(SectionContext)
  const [state, setState] = useState<IListSectionState<IListSectionData>>({
    isDataLoaded: false,
    data: {}
  })
  const fetchListData = useFetchListData()
  const shouldRenderList =
    (context.state.data.reports
      ? context.state.selectedReport.id === context.state.mostRecentReportId
      : true) && !isEmpty(state.data?.items)

  useEffect(() => {
    fetchListData().then((data) => {
      context.setState({ persistListData: { ...context.state.persistListData, [section.id]: { items: data.items } } })
      setState({ data, isDataLoaded: true })
    })
  }, [])

  return {
    state,
    items: get<any[]>(state, 'data.items', []),
    columns: get<IColumn[]>(state, 'data.columns', []),
    shouldRenderList
  } as const
}
