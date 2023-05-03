import { TypedHash } from '@pnp/common'
import moment from 'moment'
import { PortalDataService } from 'pp365-shared/lib/services'
import strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'
import { IProjectStatusContext, ProjectStatusContext } from '../context'
import { CLEAR_USER_MESSAGE, REPORT_PUBLISHED, REPORT_PUBLISH_ERROR } from '../reducer'
import { useCaptureReport } from './useCaptureReport'
import { AttachmentFileInfo } from '@pnp/sp'
import { omit } from '@fluentui/react/lib/Utilities'
import { MessageBarType } from '@fluentui/react'
import { StatusReport } from 'pp365-shared/lib/models'
import { IUserMessageProps } from 'pp365-shared/lib/components/UserMessage/types'

/**
 * Update the status report with the persisted section data and attachment.
 *
 * @param context Context for the `ProjectStatus` component
 * @param attachment Attachment file info for the report image
 */
async function updateStatusReport(
  context: IProjectStatusContext,
  attachment: AttachmentFileInfo
): Promise<{ updatedReport: StatusReport; message: Pick<IUserMessageProps, 'text' | 'type'> }> {
  const portalDataService = await new PortalDataService().configure({
    pageContext: context.props.pageContext
  })
  const properties: TypedHash<string> = {
    GtModerationStatus: strings.GtModerationStatus_Choice_Published,
    GtLastReportDate: moment().format('YYYY-MM-DD HH:mm'),
    GtSectionDataJson: JSON.stringify(context.state.persistedSectionData)
  }
  try {
    const updatedReport = await portalDataService.updateStatusReport(
      context.state.selectedReport,
      properties,
      attachment,
      strings.GtModerationStatus_Choice_Published
    )
    return { updatedReport, message: null }
  } catch (error) {
    const updatedReport = await portalDataService.updateStatusReport(
      context.state.selectedReport,
      omit(properties, ['GtSectionDataJson']),
      attachment,
      strings.GtModerationStatus_Choice_Published
    )
    return {
      updatedReport,
      message: { text: strings.PublishStatusReportSectionDataWarning, type: MessageBarType.warning }
    }
  }
}

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
  const context = useContext(ProjectStatusContext)
  const captureReport = useCaptureReport()
  return async (): Promise<void> => {
    if (!context.state.isPublishing) {
      try {
        const attachment = await captureReport(context.state.selectedReport.values.Title)
        const { updatedReport, message } = await updateStatusReport(context, attachment)
        context.dispatch(REPORT_PUBLISHED({ updatedReport, message }))
      } catch (error) {
        context.dispatch(
          REPORT_PUBLISH_ERROR({ message: { text: error.message, type: MessageBarType.error } })
        )
      } finally {
        window.setTimeout(() => {
          context.dispatch(CLEAR_USER_MESSAGE())
        }, 8000)
      }
    }
  }
}
