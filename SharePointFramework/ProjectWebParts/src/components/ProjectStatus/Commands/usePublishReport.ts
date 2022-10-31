import moment from 'moment'
import { PortalDataService } from 'pp365-shared/lib/services'
import strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'
import { useCaptureReport } from './useCaptureReport'

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
                const properties = {
                    GtModerationStatus: strings.GtModerationStatus_Choice_Published,
                    GtLastReportDate: moment().format('YYYY-MM-DD HH:mm')
                }
                await portalDataService.updateStatusReport(context.state.selectedReport.id, properties, attachment)
            } catch (error) { }
            document.location.reload()
        }
    }
}
