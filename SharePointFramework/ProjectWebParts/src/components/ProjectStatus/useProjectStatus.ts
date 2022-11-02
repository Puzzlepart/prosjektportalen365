/* eslint-disable prefer-spread */
import { SectionModel, StatusReport } from 'pp365-shared/lib/models'
import { getUrlParam, parseUrlHash } from 'pp365-shared/lib/util'
import { ProviderProps, useEffect, useState } from 'react'
import { find, first } from 'underscore'
import { fetchData } from './fetchData'
import { IProjectStatusHashState, IProjectStatusProps, IProjectStatusState } from './types'
import { IProjectStatusContext } from './context'

/**
 * Component logic hook for `ProjectStatus`
 */
export function useProjectStatus(props: IProjectStatusProps) {
  const [state, $setState] = useState<IProjectStatusState>({
    isDataLoaded: false,
    selectedReport: new StatusReport({}),
    data: {
      reports: [],
      sections: Array.apply(null, Array(6)).map(() => new SectionModel({ ContentTypeId: '' })),
      columnConfig: []
    }
  })

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
        isDataLoaded: true,
        mostRecentReportId: newestReportId,
        userHasAdminPermission: data.userHasAdminPermission
      })
    })
  }, [])

  return { value: { props, state, setState } } as ProviderProps<IProjectStatusContext>
}
