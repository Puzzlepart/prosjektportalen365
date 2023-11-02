import strings from 'ProjectWebPartsStrings'
import moment from 'moment'
import { PortalDataService } from 'pp365-shared-library/lib/services'
import { useProjectStatusContext } from '../context'
import {
  CLEAR_USER_MESSAGE,
  REPORT_PUBLISHED,
  REPORT_PUBLISHING,
  REPORT_PUBLISH_ERROR
} from '../reducer'
import { useCaptureReportSnapshot } from './useCaptureReportSnapshot'

/**
 * Hook for publishing of reports. Returns a callback function
 * for publishing the selected report. The hook `useCaptureReport`
 * is used to capture the report as an image and attach it to the
 * SharePoint list item. The status of the report list item is
 * also updated to published (`GtModerationStatus_Choice_Published` from `strings`)
 *
 * @returns A function callback that returns a promise of void
 */
export function usePublishReport() {
  const context = useProjectStatusContext()
  const captureReportSnapshot = useCaptureReportSnapshot()
  return async (): Promise<void> => {
    const portalDataService = await new PortalDataService().configure({
      spfxContext: context.props.spfxContext
    })
    if (!context.state.isPublishing) {
      try {
        context.dispatch(REPORT_PUBLISHING())
        const snapshot = await captureReportSnapshot()
        const attachments = [
          {
            url: context.props.snapshotAttachmentFileName,
            content: snapshot
          },
          {
            url: context.props.persistSectionDataAttachmentFileName,
            content: JSON.stringify(context.state.persistedSectionData)
          }
        ]
        const updatedReport = await portalDataService.publishStatusReport(
          context.state.selectedReport,
          moment().format('YYYY-MM-DD HH:mm'),
          attachments,
          strings.GtModerationStatus_Choice_Published
        )
        context.dispatch(REPORT_PUBLISHED({ updatedReport, message: null }))
      } catch (error) {
        context.dispatch(
          REPORT_PUBLISH_ERROR({ message: { message: error.message, intent: 'error' } })
        )
      } finally {
        window.setTimeout(() => {
          context.dispatch(CLEAR_USER_MESSAGE())
        }, 8000)
      }
    }
  }
}
