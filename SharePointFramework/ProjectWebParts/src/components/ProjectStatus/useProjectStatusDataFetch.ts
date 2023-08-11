import { LogLevel } from '@pnp/logging'
import { AnyAction } from '@reduxjs/toolkit'
import strings from 'ProjectWebPartsStrings'
import _ from 'lodash'
import {
  StatusReport,
  ProjectAdminPermission,
  getUrlParam,
  parseUrlHash
} from 'pp365-shared-library/lib'
import { useEffect } from 'react'
import SPDataAdapter from '../../data'
import { DataFetchFunction } from '../../types/DataFetchFunction'
import { INIT_DATA } from './reducer'
import { IProjectStatusData, IProjectStatusProps } from './types'

export type FetchDataResult = {
  data: IProjectStatusData
  initialSelectedReport: StatusReport
  sourceUrl: string
}

/**
 * Fetch data for `ProjectStatus`. Feetches project properties, status report list properties,
 * status reports, project status sections, project column config, and project status list fields.
 * If the selected report is published, the attachments for the report are also fetched.
 */
const fetchData: DataFetchFunction<IProjectStatusProps, FetchDataResult> = async (props) => {
  try {
    if (!SPDataAdapter.isConfigured) {
      SPDataAdapter.configure(props.webPartContext, {
        siteId: props.siteId,
        webUrl: props.webUrl,
        logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
      })
    }
    const [properties, reportList, reports, sections, columnConfig, reportFields] =
      await Promise.all([
        SPDataAdapter.project.getProjectInformationData(),
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
    let sortedReports = reports.sort((a, b) => b.created.getTime() - a.created.getTime())
    const sortedSections = sections.sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1))
    let [initialSelectedReport] = sortedReports
    const hashState = parseUrlHash()
    const selectedReportUrlParam = getUrlParam('selectedReport')
    const sourceUrl = decodeURIComponent(getUrlParam('Source') ?? '')
    if (hashState.has('selectedReport')) {
      initialSelectedReport = _.find(
        sortedReports,
        (report) => report.id === (hashState.get('selectedReport') as number)
      )
    } else if (selectedReportUrlParam) {
      initialSelectedReport = _.find(
        sortedReports,
        (report) => report.id === parseInt(selectedReportUrlParam, 10)
      )
    }
    if (initialSelectedReport?.published) {
      initialSelectedReport = await SPDataAdapter.portal.getStatusReportAttachments(
        initialSelectedReport
      )
      sortedReports = sortedReports.map((report) => {
        if (report.id === initialSelectedReport.id) {
          return initialSelectedReport
        }
        return report
      })
    }
    return {
      data: {
        properties,
        reportFields,
        reportEditFormUrl: reportList.DefaultEditFormUrl,
        reports: sortedReports,
        sections: sortedSections,
        columnConfig,
        userHasAdminPermission
      },
      initialSelectedReport,
      sourceUrl
    }
  } catch (error) {
    throw strings.ProjectStatusDataErrorText
  }
}

/**
 * Fetch hook for `ProjectStatus`. Only fetches data on mount using
 * `useEffect` with an empty dependency array.
 *
 * @param props Component properties for `ProjectStatus`
 * @param dispatch Dispatcer
 */
export const useProjectStatusDataFetch = (
  props: IProjectStatusProps,
  dispatch: React.Dispatch<AnyAction>
) => {
  useEffect(() => {
    fetchData(props).then((data) => dispatch(INIT_DATA(data)))
  }, [])
}
