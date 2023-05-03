import { TypedHash } from '@pnp/common'
import moment from 'moment'
import { PortalDataService } from 'pp365-shared/lib/services'
import strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'
import { REPORT_PUBLISHED } from '../reducer'
import { useCaptureReport } from './useCaptureReport'

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
    const portalDataService = await new PortalDataService().configure({
      pageContext: context.props.pageContext
    })
    if (!context.state.isPublishing) {
      try {
        const attachmentsFolder = portalDataService.web.getFolderByServerRelativeUrl('/sites/pp365/Prosjektstatus_vedlegg')
        const attachment = await captureReport(context.state.selectedReport.values.Title)
        const properties: TypedHash<string> = {
          GtLastReportDate: moment().format('YYYY-MM-DD HH:mm')
        }
        const updatedReport = await portalDataService.updateStatusReport(
          context.state.selectedReport,
          properties,
          attachment,
          strings.GtModerationStatus_Choice_Published
        )
        await attachmentsFolder.files.add(`PersistedSectionData-${updatedReport.id}.txt`, JSON.stringify(context.state.persistedSectionData))
        context.dispatch(REPORT_PUBLISHED({ updatedReport }))
      } catch (error) { 
        // eslint-disable-next-line no-console
        console.error(error)
      }
    }
  }
}
