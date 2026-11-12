import {
  getAllScopesFilter,
  ProjectColumnConfig,
  SectionModel,
  StatusReport
} from 'pp365-shared-library/lib'
import SPDataAdapter from '../../../data'
import { DataFetchFunction } from '../../../types/DataFetchFunction'
import { IProjectInformationContext } from '../context'
import resource from 'SharedResources'

/**
 * Fetches published reports across all project series, with section and column configuration.
 * Returns empty arrays when reports are hidden or the hub data cannot be read.
 */
export const fetchProjectStatusReportData: DataFetchFunction<
  IProjectInformationContext,
  [StatusReport[], SectionModel[], ProjectColumnConfig[]]
> = async (context) => {
  if (context.props.hideStatusReport || !SPDataAdapter.portalDataService?.isAvailable) {
    return [[], [], []]
  }
  try {
    const reports = await SPDataAdapter.portalDataService.getStatusReports({
      filter: `${getAllScopesFilter(context.props.siteId)} and GtModerationStatus eq '${
        resource.Choice_GtModerationStatus_Published
      }'`
    })
    const sections = await SPDataAdapter.portalDataService.getProjectStatusSections()
    const columnConfig = await SPDataAdapter.portalDataService.getProjectColumnConfig()
    return [reports, sections, columnConfig]
  } catch (error) {
    return [[], [], []]
  }
}
