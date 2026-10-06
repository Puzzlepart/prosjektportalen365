import { PortalDataService } from 'pp365-shared-library/lib/services'
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
    const portalDataService = await new PortalDataService().configure({
      spfxContext: context.props.spfxContext
    })
    try {
      await portalDataService.deleteStatusReport(context.state.selectedReport.id)
      context.dispatch(REPORT_DELETED())
    } catch (error) {
      context.dispatch(REPORT_DELETE_ERROR({ error }))
      window.setTimeout(() => {
        context.dispatch(CLEAR_USER_MESSAGE())
      }, 8000)
    }
  }
}
