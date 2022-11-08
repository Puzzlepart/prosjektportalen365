import { IColumn } from '@fluentui/react'
import { getObjectValue as get } from 'pp365-shared/lib/helpers'
import { useContext, useEffect, useState } from 'react'
import { isEmpty } from 'underscore'
import { ProjectStatusContext } from '../../../ProjectStatus/context'
import { IListSectionData, IListSectionState } from './types'
import { useFetchListData } from './useFetchListData'

export function useListSection() {
  const context = useContext(ProjectStatusContext)
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
      context.setState({ persistListData: { ...context.state.persistListData, 4: data.items } })
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
