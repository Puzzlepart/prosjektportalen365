import { format } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import SPDataAdapter from '../../../data'
import { useProjectStatusContext } from '../context'

/**
 * Hook for redirecting to a new status report. Uses `useEditFormUrl` hook
 * to get the edit form URL for the new report. Redirect the user to the
 * edit form URL for the new report, and sets initial values for the report
 * based on the web title and the last report (if it exists).
 *
 * @returns A function callback
 */
export function useRedirectNewStatusReport() {
  const context = useProjectStatusContext()
  return async () => {
    const [lastReport] = context.state.data.reports
    const properties: Record<string, string | number | boolean> = {}
    if (lastReport) {
      // TODO: Handle lastReport
      // properties = context.state.data.reportFields
      //   .filter(
      //     (field) =>
      //       !field.isReadOnly &&
      //       !['GtSectionDataJson'].includes(field.internalName)
      //   )
      //   .reduce((obj, field) => {
      //     const fieldValue = lastReport.values[field.internalName]
      //     if (fieldValue) obj[field.internalName] = fieldValue
      //     return obj
      //   }, {})
    }
    properties.Title = format(strings.NewStatusReportTitle, context.props.webTitle)
    properties.GtSiteId = context.props.siteId
    properties.GtModerationStatus = strings.GtModerationStatus_Choice_Draft
    const report = await SPDataAdapter.portal.addStatusReport(
      properties,
      context.state.data.properties.templateParameters?.ProjectStatusContentTypeId
    )
    document.location.hash = ''
  }
}
