import { TypedHash } from '@pnp/common'
import moment from 'moment'
import strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'
import { REPORT_PUBLISHED } from '../reducer'
import { useCaptureReport } from './useCaptureReport'

/**
 * Hook for publishing of reports.
 *
 * @returns A function callback
 */
export function usePublishReport() {
  const context = useContext(ProjectStatusContext)
  const captureReport = useCaptureReport()
  return async () => {
    if (!context.state.isPublishing) {
      try {
        const attachment = await captureReport(context.state.selectedReport.values.Title)
        const properties: TypedHash<string> = {
          GtModerationStatus: strings.GtModerationStatus_Choice_Published,
          GtLastReportDate: moment().format('YYYY-MM-DD HH:mm'),
          GtSectionDataJson: JSON.stringify(context.state.persistedSectionData)
        }
        const updatedReport = await context.portalDataService.updateStatusReport(
          context.state.selectedReport,
          properties,
          attachment,
          strings.GtModerationStatus_Choice_Published
        )
        context.dispatch(REPORT_PUBLISHED({ updatedReport }))
      } catch (error) {}
    }
  }
}
