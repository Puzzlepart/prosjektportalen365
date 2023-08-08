import { format } from '@fluentui/react'
import { PortalDataService } from 'pp365-shared-library/lib/services'
import strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'
import { useEditFormUrl } from './useEditFormUrl'

/**
 * Hook for redirecting to a new status report. Uses `useEditFormUrl` hook
 * to get the edit form URL for the new report. Redirect the user to the
 * edit form URL for the new report, and sets initial values for the report
 * based on the web title and the last report (if it exists).
 *
 * @returns A function callback
 */
export function useRedirectNewStatusReport() {
  const context = useContext(ProjectStatusContext)
  const getEditFormUrl = useEditFormUrl()
  return async () => {
    const portalDataService = await new PortalDataService().configure({
      spfxContext: context.props.webPartContext
    })
    const [lastReport] = context.state.data.reports
    let properties: Record<string, string | number | boolean> = {}
    if (lastReport) {
      properties = context.state.data.reportFields
        .filter(
          (field) =>
            field.SchemaXml.indexOf('ReadOnly="TRUE"') === -1 &&
            !['GtSectionDataJson'].includes(field.InternalName)
        )
        .reduce((obj, field) => {
          const fieldValue = lastReport.values[field.InternalName]
          if (fieldValue) obj[field.InternalName] = fieldValue
          return obj
        }, {})
    }
    properties.Title = format(strings.NewStatusReportTitle, context.props.webTitle)
    properties.GtSiteId = context.props.siteId
    properties.GtModerationStatus = strings.GtModerationStatus_Choice_Draft
    const report = await portalDataService.addStatusReport(
      properties,
      context.state.data.properties.templateParameters?.ProjectStatusContentTypeId
    )
    document.location.hash = ''
    document.location.href = getEditFormUrl(report)
  }
}
