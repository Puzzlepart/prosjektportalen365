import { LogLevel } from '@pnp/logging'
import SPDataAdapter from '../../data'
import { ProjectAdminPermission } from 'pp365-shared/lib/data/SPDataAdapterBase/ProjectAdminPermission'
import strings from 'ProjectWebPartsStrings'
import { IProjectStatusData, IProjectStatusProps } from './types'

/**
 * Fetch data
 *
 * @param props Props
 */
export const fetchData = async (props: IProjectStatusProps): Promise<IProjectStatusData> => {
  try {
    if (!SPDataAdapter.isConfigured) {
      SPDataAdapter.configure(props.webPartContext, {
        siteId: props.siteId,
        webUrl: props.webUrl,
        hubSiteUrl: props.hubSite.url,
        logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
      })
    }
    const [
      properties,
      reportList,
      reports,
      sections,
      columnConfig,
      reportFields
    ] = await Promise.all([
      SPDataAdapter.project.getPropertiesData(),
      SPDataAdapter.portal.getStatusReportListProps(),
      SPDataAdapter.portal.getStatusReports({
        useCaching: false,
        publishedString: strings.GtModerationStatus_Choice_Published
      }),
      SPDataAdapter.portal.getProjectStatusSections(),
      SPDataAdapter.portal.getProjectColumnConfig(),
      SPDataAdapter.portal.getListFields(
        'PROJECT_STATUS',
        // eslint-disable-next-line quotes
        "Hidden eq false and Group ne 'Hidden'"
      )
    ])
    const userHasAdminPermission = await SPDataAdapter.checkProjectAdminPermissions(
      ProjectAdminPermission.ProjectStatusAdmin,
      properties.fieldValues
    )
    const sortedReports = reports.sort((a, b) => b.created.getTime() - a.created.getTime())
    const sortedSections = sections.sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1))
    return {
      properties,
      reportFields,
      reportEditFormUrl: reportList.DefaultEditFormUrl,
      reports: sortedReports,
      sections: sortedSections,
      columnConfig,
      userHasAdminPermission
    }
  } catch (error) {
    throw strings.ProjectStatusDataErrorText
  }
}
