import { format } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import { ItemFieldValue } from 'pp365-shared-library'
import { useProjectStatusContext } from '../context'
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
   * `GtSectionDataJson`, `GtLastReportDate` or status page identity fields.
   */
  const reportFields = state.data.reportFields.filter(
    (field) =>
      !field.isReadOnly &&
      ![
        'GtSectionDataJson',
        'GtLastReportDate',
        'GtStatusPageId',
        'GtStatusPageTitle',
        'GtStatusPageUrl'
      ].includes(field.internalName)
  )

  /**
   * Creates a new status report with the given properties and passes the parameters to the edit status panel.
   * If there is a last report, it will use its field values for the new report. When the web part is
   * configured with a separate report series, the status page identity is stamped on the new report
   * so it can be distinguished from other report series for the same project.
   */
  const createNewStatusReport = async () => {
    const statusPage = state.data.statusPage
    let properties: Record<string, any> = {
      Title: statusPage
        ? format(strings.NewStatusReportTitle, `${props.webTitle} – ${statusPage.title}`)
        : format(strings.NewStatusReportTitle, props.webTitle),
      GtSiteId: props.siteId,
      GtModerationStatus: resource.Choice_GtModerationStatus_Draft,
      ...(statusPage
        ? {
            GtStatusPageId: statusPage.id,
            GtStatusPageTitle: statusPage.title,
            GtStatusPageUrl: statusPage.url
          }
        : {})
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
