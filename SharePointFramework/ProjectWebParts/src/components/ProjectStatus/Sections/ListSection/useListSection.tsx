import { ProjectStatusContext } from '../../../ProjectStatus/context'
import { useContext, useEffect, useState } from 'react'
import { isEmpty } from 'underscore'
import { IListSectionData, IListSectionState } from './types'
import { useFetchListData } from './useFetchListData'

export function useListSection() {
  const context = useContext(ProjectStatusContext)
  const [state, setState] = useState<IListSectionState<IListSectionData>>({
    isDataLoaded: false,
    data: {}
  })
  const fetchListData = useFetchListData()
  const showLists =
    (context.state.data.reports
      ? context.state.selectedReport.id === context.state.mostRecentReportId
      : true) && !isEmpty(state.data?.items)

  useEffect(() => {
    fetchListData().then((data) => setState({ data, isDataLoaded: true }))
  }, [])

  return { state, showLists } as const
}
