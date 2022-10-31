import { getUrlParam, parseUrlHash } from 'pp365-shared/lib/util'
import { useEffect, useState } from 'react'
import { find, first } from 'underscore'
import { fetchData } from './fetchData'
import { IProjectStatusHashState, IProjectStatusProps, IProjectStatusState } from './types'

export function useProjectStatus(props: IProjectStatusProps) {
  const [state, $setState] = useState<IProjectStatusState>({ loading: true, data: { reports: [] } })

  const setState = (newState: Partial<IProjectStatusState>) => {
    $setState((_state) => ({ ..._state, ...newState }))
  }

  useEffect(() => {
    fetchData(props).then((data) => {
      let [selectedReport] = data.reports
      const hashState = parseUrlHash<IProjectStatusHashState>()
      const selectedReportUrlParam = getUrlParam('selectedReport')
      const sourceUrlParam = getUrlParam('Source')
      if (hashState.selectedReport) {
        selectedReport = find(
          data.reports,
          (report) => report.id === parseInt(hashState.selectedReport, 10)
        )
      } else if (selectedReportUrlParam) {
        selectedReport = find(
          data.reports,
          (report) => report.id === parseInt(selectedReportUrlParam, 10)
        )
      }
      const newestReportId = first(data.reports)?.id ?? 0

      setState({
        data,
        selectedReport,
        sourceUrl: decodeURIComponent(sourceUrlParam || ''),
        loading: false,
        newestReportId,
        userHasAdminPermission: data.userHasAdminPermission
      })
    })
  }, [])

  return { state, setState } as const
}
