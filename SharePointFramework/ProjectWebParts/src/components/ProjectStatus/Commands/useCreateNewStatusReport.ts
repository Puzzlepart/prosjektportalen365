import { format } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import { ItemFieldValue, buildScopedSiteId } from 'pp365-shared-library'
import { useProjectStatusContext } from '../context'
import { getScopeLabel, parseSubProjects } from '../parseSubProjects'
import { OPEN_PANEL } from '../reducer'
import resource from 'SharedResources'

/**
 * Hook for creating new status reports. Returns a callback function
 * for creating a new status report.
 */
export function useCreateNewStatusReport() {
  const { state, dispatch, props } = useProjectStatusContext()
  const [lastReport] = state.data.reports

  /**
   * Get the report fields that are not read-only and not the
   * `GtSectionDataJson` or `GtLastReportDate` fields.
   */
  const reportFields = state.data.reportFields.filter(
    (field) =>
      !field.isReadOnly && !['GtSectionDataJson', 'GtLastReportDate'].includes(field.internalName)
  )

  /**
   * Creates a new status report with the given properties and passes the parameters to the edit status panel.
   * If there is a last report, it will use its field values for the new report (the report list is
   * already scoped to the selected report series). When a report scope ("delprosjekt") is selected,
   * the scope key is appended to the project's existing site ID (`GtSiteId = {siteId}-{scopeKey}`)
   * so the report series can be distinguished from the project's other series.
   */
  const createNewStatusReport = async () => {
    const selectedScope = (state.selectedScope ?? '').trim()
    const scopeLabel = getScopeLabel(parseSubProjects(props.subProjects), selectedScope)
    let properties: Record<string, any> = {
      Title: selectedScope
        ? format(strings.NewStatusReportTitle, `${props.webTitle} – ${scopeLabel}`)
        : format(strings.NewStatusReportTitle, props.webTitle),
      GtSiteId: buildScopedSiteId(props.siteId, selectedScope),
      GtModerationStatus: resource.Choice_GtModerationStatus_Draft
    }
    if (lastReport?.fieldValues) {
      properties = reportFields.reduce((obj, field) => {
        const fieldValue = lastReport.fieldValues.get<ItemFieldValue>(field.internalName)?.value
        if (fieldValue && !obj[field.internalName]) obj[field.internalName] = fieldValue
        return obj
      }, properties)
    }

    const statusContentId: string =
      state.data.properties.templateParameters?.ProjectStatusContentTypeId

    dispatch(
      OPEN_PANEL({
        name: 'EditStatusPanel',
        headerText: strings.NewStatusPanelTitle,
        reportProps: properties,
        contentId: statusContentId
      })
    )
  }

  return createNewStatusReport
}
