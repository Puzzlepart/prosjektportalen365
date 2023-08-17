import strings from 'ProjectWebPartsStrings'
import { ProjectColumnConfig, SectionModel, StatusReport } from 'pp365-shared-library/lib'
import SPDataAdapter from '../../../data'
import { DataFetchFunction } from '../../../types/DataFetchFunction'
import { IProjectInformationContext } from '../context'

/**
 * Fetch project status reports (top: 1), sections and column config  if `props.hideStatusReport` is false.
 * Catches errors and returns empty arrays to support e.g. the case where the user does not have
 * access to the hub site.
 *
 * @param context Context for `ProjectInformation`
 */
export const fetchProjectStatusReportData: DataFetchFunction<
  IProjectInformationContext,
  [StatusReport[], SectionModel[], ProjectColumnConfig[]]
> = async (context) => {
  if (context.props.hideStatusReport) {
    return [[], [], []]
  }
  try {
    const [reports, sections, columnConfig] = await Promise.all([
      SPDataAdapter.portal.getStatusReports({
        filter: `(GtSiteId eq '${context.props.siteId}') and GtModerationStatus eq '${strings.GtModerationStatus_Choice_Published}'`,
        publishedString: strings.GtModerationStatus_Choice_Published,
        top: 1
      }),
      SPDataAdapter.portal.getProjectStatusSections(),
      SPDataAdapter.portal.getProjectColumnConfig()
    ])
    return [reports, sections, columnConfig]
  } catch (error) {
    return [[], [], []]
  }
}
