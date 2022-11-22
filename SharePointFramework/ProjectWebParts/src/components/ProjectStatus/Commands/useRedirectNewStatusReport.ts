import { format } from '@fluentui/react'
import { TypedHash } from '@pnp/common'
import strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'
import { ProjectStatusContext } from '../context'
import { useEditFormUrl } from './useEditFormUrl'

/**
 * Hook for redirecting to a new status report.
 *
 * @returns A function callback
 */
export function useRedirectNewStatusReport() {
  const context = useContext(ProjectStatusContext)
  const getEditFormUrl = useEditFormUrl()
  return async () => {
    const [lastReport] = context.state.data.reports
    let properties: TypedHash<string | number | boolean> = {}
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
    properties.Title = format(strings.NewStatusReportTitle, context.props.spfxContext.pageContext.web.title)
    properties.GtSiteId = context.props.spfxContext.pageContext.site.id.toString()
    properties.GtModerationStatus = strings.GtModerationStatus_Choice_Draft
    const report = await context.portalDataService.addStatusReport(
      properties,
      context.state.data.properties.templateParameters?.ProjectStatusContentTypeId
    )
    document.location.hash = ''
    document.location.href = getEditFormUrl(report)
  }
}
