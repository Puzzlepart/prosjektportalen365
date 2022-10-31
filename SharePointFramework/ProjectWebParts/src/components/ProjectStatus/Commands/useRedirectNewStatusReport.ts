import { format } from '@fluentui/react'
import { TypedHash } from '@pnp/common'
import { Logger, LogLevel } from '@pnp/logging'
import { PortalDataService } from 'pp365-shared/lib/services'
import strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'

export function useRedirectNewStatusReport() {
    const context = useContext(ProjectStatusContext)
    return async () => {
        const portalDataService = new PortalDataService().configure({
            urlOrWeb: context.props.hubSite.web,
            siteId: context.props.siteId
        })
        const [lastReport] = context.state.data.reports
        let properties: TypedHash<string | number | boolean> = {}
        if (lastReport) {
            properties = context.state.data.reportFields
                .filter((field) => field.SchemaXml.indexOf('ReadOnly="TRUE"') === -1)
                .reduce((obj, field) => {
                    const fieldValue = lastReport.values[field.InternalName]
                    if (fieldValue)
                        obj[field.InternalName] = fieldValue
                    return obj
                }, {})
        }
        properties.Title = format(strings.NewStatusReportTitle, context.props.webTitle)
        properties.GtSiteId = context.props.siteId
        properties.GtModerationStatus = strings.GtModerationStatus_Choice_Draft
        Logger.log({
            message: '(ProjectStatus) _redirectNewStatusReport: Created new status report',
            data: { fieldValues: properties },
            level: LogLevel.Info
        })
        const { editFormUrl } = await portalDataService.addStatusReport(
            properties,
            context.state.data.properties.templateParameters?.ProjectStatusContentTypeId,
            context.state.data.reportEditFormUrl
        )
        document.location.hash = ''
        document.location.href = editFormUrl
    }
}
