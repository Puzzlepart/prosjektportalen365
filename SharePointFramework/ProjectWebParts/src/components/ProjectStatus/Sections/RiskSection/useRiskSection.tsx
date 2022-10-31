import { ProjectStatusContext } from 'components/ProjectStatus/context'
import { useContext, useEffect, useState } from 'react'
import { useFetchListData } from './useFetchListData'
import { IRiskSectionState } from './types'

export function useRiskSection() {
  const context = useContext(ProjectStatusContext)
  const [state, setState] = useState<IRiskSectionState>({ isDataLoaded: false })
  const fetchListData = useFetchListData()
  const showLists = context.state.data.reports
    ? context.state.selectedReport.id === context.state.mostRecentReportId
    : true

  useEffect(() => {
    fetchListData().then((data) => setState({ data, isDataLoaded: false }))
  }, [])

  return { state, showLists } as const
}
