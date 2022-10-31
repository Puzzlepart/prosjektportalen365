import { ProjectStatusContext } from 'components/ProjectStatus/context'
import { useContext, useEffect, useState } from 'react'
import { useFetchListData } from './fetchListData'
import { IRiskSectionState } from './types'

export function useRiskSection() {
  const context = useContext(ProjectStatusContext)
  const [state, setState] = useState<IRiskSectionState>({ loading: true })
  const fetchListData = useFetchListData()
  const showLists = context.state.data.reports
    ? context.state.selectedReport.id === context.state.newestReportId
    : true

  useEffect(() => {
    fetchListData().then((data) => setState({ data, loading: false }))
  }, [])

  return { state, showLists } as const
}
