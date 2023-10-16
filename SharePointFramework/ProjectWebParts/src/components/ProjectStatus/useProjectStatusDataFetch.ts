import { LogLevel } from '@pnp/logging'
import { AnyAction } from '@reduxjs/toolkit'
import strings from 'ProjectWebPartsStrings'
import _ from 'lodash'
import {
  ProjectAdminPermission,
  ProjectInformationField,
  getUrlParam,
  parseUrlHash
} from 'pp365-shared-library/lib'
import { useEffect } from 'react'
import SPDataAdapter from '../../data'
import { DataFetchFunction } from '../../types/DataFetchFunction'
import { INIT_DATA } from './reducer'
import { FetchDataResult, IProjectStatusProps } from './types'

/**
 * Get report fields for Project Status. If content type ID is not provided,
 * the ID "0x010022252E35737A413FB56A1BA53862F6D5" is used, which is the ID
 * for the default content type for Project Status.
 *
 * @param contentTypeId Content type ID for Project Status
 */
async function getReportFields(contentTypeId = '0x010022252E35737A413FB56A1BA53862F6D5') {
  const fields = await SPDataAdapter.portal.getContentTypeFields(contentTypeId)
  const reportFields = fields.map((field) => new ProjectInformationField(field))
  return reportFields
}

/**
 * Fetch data for `ProjectStatus`. Feetches project properties, status report list properties,
 * status reports, project status sections, project column config, and project status list fields.
 * If the selected report is published, the attachments for the report are also fetched.
 */
const fetchData: DataFetchFunction<IProjectStatusProps, FetchDataResult> = async (props) => {
  try {
    if (!SPDataAdapter.isConfigured) {
      SPDataAdapter.configure(props.spfxContext, {
        siteId: props.siteId,
        webUrl: props.webAbsoluteUrl,
        logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
      })
    }
    const [properties, reportList, reports, sections, columnConfig] = await Promise.all([
      SPDataAdapter.project.getProjectInformationData(),
      SPDataAdapter.portal.getStatusReportListProps(),
      SPDataAdapter.portal.getStatusReports({ useCaching: false }),
      SPDataAdapter.portal.getProjectStatusSections(),
      SPDataAdapter.portal.getProjectColumnConfig()
    ])
    const reportFields = await getReportFields(
      properties.templateParameters?.ProjectStatusContentTypeId
    )
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
