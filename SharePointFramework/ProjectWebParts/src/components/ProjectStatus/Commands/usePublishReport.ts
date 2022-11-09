import { TypedHash } from '@pnp/common'
import moment from 'moment'
import { PortalDataService } from 'pp365-shared/lib/services'
import strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'
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
    const portalDataService = new PortalDataService().configure({
      urlOrWeb: context.props.hubSite.web,
      siteId: context.props.siteId
    })
    if (!context.state.isPublishing) {
      try {
        const attachment = await captureReport(context.state.selectedReport.values.Title)
        const properties: TypedHash<string> = {
          GtModerationStatus: strings.GtModerationStatus_Choice_Published,
          GtLastReportDate: moment().format('YYYY-MM-DD HH:mm'),
          GtSectionDataJson: JSON.stringify(context.state.persistListData)
        }
        const updatedReport = await portalDataService.updateStatusReport(
          context.state.selectedReport,
          properties,
          attachment,
          strings.GtModerationStatus_Choice_Published
        )
        const reports = context.state.data.reports.map((r) => {
          return updatedReport.id === r.id ? updatedReport : r
        })
        context.setState({
          data: {
            ...context.state.data,
            reports
          },
          selectedReport: updatedReport
        })
      } catch (error) {}
    }
  }
}
