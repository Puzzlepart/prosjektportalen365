import { AnyAction } from '@reduxjs/toolkit'
import { ProjectAdminPermission } from 'pp365-shared/lib/data/SPDataAdapterBase/ProjectAdminPermission'
import strings from 'ProjectWebPartsStrings'
import { useEffect } from 'react'
import SPDataAdapter from '../../data'
import { DataFetchFunction } from '../../types/DataFetchFunction'
import { INIT_DATA } from './reducer'
import { IProjectStatusData, IProjectStatusProps } from './types'

/**
 * Fetch data for `ProjectStatus`
 */
const fetchData: DataFetchFunction<IProjectStatusProps, IProjectStatusData> = async (props) => {
  try {
    if (!SPDataAdapter.isConfigured) {
      SPDataAdapter.configure(props.spfxContext, { hubSiteContext: props.hubSiteContext })
    }
    const [
      properties,
      reportList,
      reports,
      sections,
      columnConfig,
      reportFields
    ] = await Promise.all([
      SPDataAdapter.projectService.getPropertiesData(),
      SPDataAdapter.portalService.getStatusReportListProps(),
      SPDataAdapter.portalService.getStatusReports({
        useCaching: false,
        publishedString: strings.GtModerationStatus_Choice_Published
      }),
      SPDataAdapter.portalService.getProjectStatusSections(),
      SPDataAdapter.portalService.getProjectColumnConfig(),
      SPDataAdapter.portalService.getListFields(
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

/**
 * Fetch hook for `ProjectStatus`
 *
 * @param props Component properties for `ProjectStatus`
 * @param dispatch Dispatcer
 */
export const useProjectStatusDataFetch = (
  props: IProjectStatusProps,
  dispatch: React.Dispatch<AnyAction>
) => {
  useEffect(() => {
    fetchData(props)
      .then((data) => dispatch(INIT_DATA({ data })))
  }, [])
}