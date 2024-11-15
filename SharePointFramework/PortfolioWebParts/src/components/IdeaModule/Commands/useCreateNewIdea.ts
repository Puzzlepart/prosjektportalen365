import { useIdeaModuleContext } from '../context'

/**
 * Hook for creating new status reports. Returns a callback function
 * for creating a new status report.
 */
export const useCreateNewIdea = () => {
  const context = useIdeaModuleContext()

  console.log('create', context)
  // const { state, dispatch, props } = useProjectStatusContext()
  // const [lastReport] = state.data.reports

  // /**
  //  * Get the report fields that are not read-only and not the
  //  * `GtSectionDataJson` or `GtLastReportDate` fields.
  //  */
  // const reportFields = state.data.reportFields.filter(
  //   (field) =>
  //     !field.isReadOnly && !['GtSectionDataJson', 'GtLastReportDate'].includes(field.internalName)
  // )

  // /**
  //  * Creates a new status report with the given properties and adds it to the portal.
  //  * If there is a last report, it will use its field values for the new report.
  //  */
  // const createNewStatusReport = async () => {
  //   let properties: Record<string, any> = {
  //     Title: format(strings.NewStatusReportTitle, props.webTitle),
  //     GtSiteId: props.siteId,
  //     GtModerationStatus: strings.GtModerationStatus_Choice_Draft
  //   }
  //   if (lastReport?.fieldValues) {
  //     properties = reportFields.reduce((obj, field) => {
  //       const fieldValue = lastReport.fieldValues.get<ItemFieldValue>(field.internalName)?.value
  //       if (fieldValue && !obj[field.InternalName]) obj[field.internalName] = fieldValue
  //       return obj
  //     }, properties)
  //   }
  //   const report = await SPDataAdapter.portalDataService.addStatusReport(
  //     properties,
  //     state.data.properties.templateParameters?.ProjectStatusContentTypeId
  //   )
  //   dispatch(SELECT_REPORT({ report }))
  //   dispatch(OPEN_PANEL({ name: 'EditStatusPanel', headerText: strings.NewStatusPanelTitle }))
  // }

  // return createNewStatusReport
}
