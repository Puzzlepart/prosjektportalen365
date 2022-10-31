import { PortalDataService } from 'pp365-shared/lib/services'
import { getUrlParam } from 'pp365-shared/lib/util/getUrlParam'
import { useContext } from 'react'
import { first } from 'underscore'
import { ProjectStatusContext } from '../context'

export function useDeleteReport() {
    const context = useContext(ProjectStatusContext)
    return async () => {
        const portalDataService = new PortalDataService().configure({
            urlOrWeb: context.props.hubSite.web,
            siteId: context.props.siteId
        })
        await portalDataService.deleteStatusReport(context.state.selectedReport.id)
        try {
            let [selectedReport] = context.state.data.reports
            const sourceUrlParam = getUrlParam('Source')

            if (context.state.data.reports.length > 0) {
                selectedReport = context.state.data.reports[0]
            }

            const newestReportId = first(context.state.data.reports)?.id ?? 0

            context.setState({
                selectedReport,
                sourceUrl: decodeURIComponent(sourceUrlParam || ''),
                loading: false,
                newestReportId
            })
        } catch (error) {
            context.setState({ error, loading: false })
        }
    }
}
