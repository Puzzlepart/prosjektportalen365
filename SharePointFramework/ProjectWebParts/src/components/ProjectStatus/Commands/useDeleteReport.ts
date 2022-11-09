import { PortalDataService } from 'pp365-shared/lib/services'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'
import { REPORT_DELETED, REPORT_DELETE_ERROR } from '../reducer'

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
    try {
      await portalDataService.deleteStatusReport(context.state.selectedReport.id)
      context.dispatch(REPORT_DELETED())
    } catch (error) {
      context.dispatch(REPORT_DELETE_ERROR())
    }
  }
}
