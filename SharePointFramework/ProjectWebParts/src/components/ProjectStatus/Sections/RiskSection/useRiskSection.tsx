import { ProjectStatusContext } from 'components/ProjectStatus/context'
import { useContext, useEffect, useState } from 'react'
import { useFetchListData } from './useFetchListData'
import { IRiskSectionState } from './types'
import { isEmpty } from 'underscore'

export function useRiskSection() {
  const context = useContext(ProjectStatusContext)
  const [state, setState] = useState<IRiskSectionState>({ isDataLoaded: false, data: {} })
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
