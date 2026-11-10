import SPDataAdapter from '../../../data'
import { useProjectStatusContext } from '../context'
import { CLEAR_USER_MESSAGE, REPORT_DELETED, REPORT_DELETE_ERROR } from '../reducer'

/**
 * Hook for deletion of report. Returns a callback function
 * for deleting the selected report. A failed delete shows its
 * error as a user message, cleared after 8 seconds as after publishing.
 *
 * @returns A function callback
 */
export function useDeleteReport() {
  const context = useProjectStatusContext()
  return async () => {
    try {
      // The web part's own service: it knows where the project keeps its reports.
      await SPDataAdapter.portalDataService.deleteStatusReport(context.state.selectedReport.id)
      context.dispatch(REPORT_DELETED())
    } catch (error) {
      context.dispatch(REPORT_DELETE_ERROR({ error }))
      window.setTimeout(() => {
        context.dispatch(CLEAR_USER_MESSAGE())
      }, 8000)
    }
  }
}
