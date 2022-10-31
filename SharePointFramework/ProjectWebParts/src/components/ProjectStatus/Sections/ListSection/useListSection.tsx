import { ProjectStatusContext } from 'components/ProjectStatus/context'
import { useContext, useEffect, useState } from 'react'
import { IListSectionData, IListSectionState } from './types'
import { useFetchListData } from './useFetchListData'

export function useListSection() {
  const context = useContext(ProjectStatusContext)
  const [state, setState] = useState<IListSectionState<IListSectionData>>({ isDataLoaded: false })
  const fetchListData = useFetchListData()
  const showLists = context.state.data.reports
    ? context.state.selectedReport.id === context.state.mostRecentReportId
    : true

  useEffect(() => {
    fetchListData().then((data) => setState({ data, isDataLoaded: true }))
  }, [])

  return { state, showLists } as const
}
