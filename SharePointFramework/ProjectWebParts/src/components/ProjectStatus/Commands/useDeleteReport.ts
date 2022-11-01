import { PortalDataService } from 'pp365-shared/lib/services'
import { getUrlParam } from 'pp365-shared/lib/util/getUrlParam'
import { useContext } from 'react'
import { first } from 'underscore'
import { ProjectStatusContext } from '../context'

/**
 * Hook for deletion of report.
 *
 * @returns A function callback
 */
export function useDeleteReport() {
  const context = useContext(ProjectStatusContext)
  return async () => {
    const portalDataService = new PortalDataService().configure({
      urlOrWeb: context.props.hubSite.web,
      siteId: context.props.siteId
    })
    await portalDataService.deleteStatusReport(context.state.selectedReport.id)
    const reports = context.state.data.reports.filter(
      (r) => r.id !== context.state.selectedReport.id
    )
    try {
      const selectedReport = first(reports)
      const sourceUrlParam = getUrlParam('Source')
      const mostRecentReportId = selectedReport?.id ?? 0
      context.setState({
        data: {
          ...context.state.data,
          reports
        },
        selectedReport,
        sourceUrl: decodeURIComponent(sourceUrlParam || ''),
        mostRecentReportId
      })
    } catch (error) {
      context.setState({ error, isDataLoaded: true })
    }
  }
}
