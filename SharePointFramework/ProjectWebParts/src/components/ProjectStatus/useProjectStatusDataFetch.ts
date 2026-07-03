import { MessageBarType } from '@fluentui/react'
import { LogLevel } from '@pnp/logging'
import { AnyAction } from '@reduxjs/toolkit'
import strings from 'ProjectWebPartsStrings'
import _ from 'lodash'
import {
  CustomError,
  EditableSPField,
  ProjectAdminPermission,
  getUrlParam,
  isUnauthorizedError,
  parseUrlHash
} from 'pp365-shared-library'
import resource from 'SharedResources'
import { useEffect } from 'react'
import SPDataAdapter from '../../data'
import { DataFetchFunction } from '../../types/DataFetchFunction'
import { FETCH_DATA_ERROR, INIT_DATA } from './reducer'
import { FetchDataResult, IProjectStatusProps, IStatusPageInfo } from './types'

/**
 * Get report fields for Project Status. If content type ID is not provided,
 * the ID "0x010022252E35737A413FB56A1BA53862F6D5" is used, which is the ID
 * for the default content type for Project Status.
 *
 * @param contentTypeId Content type ID for Project Status
 */
async function getReportFields(contentTypeId = '0x010022252E35737A413FB56A1BA53862F6D5') {
  const fields = await SPDataAdapter.portalDataService.getContentTypeFields(contentTypeId)
  const reportFields = fields.map((field) => new EditableSPField(field))
  return reportFields
}

function isNoHubError(error: unknown) {
  return SPDataAdapter.portalDataService?.isAvailable === false || isUnauthorizedError(error)
}

/**
 * Resolves the identity of the status page the web part is placed on (used
 * to scope the report series when `useSeparateReportSeries` is enabled). The
 * page's `UniqueId`, `Title` and site-relative URL are read from the SitePages
 * item the web part is hosted on. Returns `null` when the page context has no
 * list item (e.g. in the local workbench), in which case the web part falls
 * back to the default report series.
 *
 * @param props Component properties for `ProjectStatus`
 */
async function getStatusPageInfo(props: IProjectStatusProps): Promise<IStatusPageInfo> {
  const { list, listItem } = props.pageContext ?? {}
  if (!list || !listItem) {
    // eslint-disable-next-line no-console
    console.warn(
      '(ProjectStatus) `useSeparateReportSeries` is enabled, but the page context has no list item. Falling back to the default report series.'
    )
    return null
  }
  const pageItem = await props.sp.web.lists
    .getById(list.id.toString())
    .items.getById(listItem.id)
    .select('UniqueId', 'Title', 'FileRef')<{ UniqueId: string; Title: string; FileRef: string }>()
  const webServerRelativeUrl = (props.webServerRelativeUrl ?? '').replace(/\/$/, '')
  const pageUrl = pageItem.FileRef?.toLowerCase().startsWith(webServerRelativeUrl.toLowerCase())
    ? pageItem.FileRef.slice(webServerRelativeUrl.length).replace(/^\//, '')
    : pageItem.FileRef
  return {
    id: pageItem.UniqueId?.toLowerCase(),
    title: pageItem.Title || pageUrl?.split('/').pop()?.replace(/\.aspx$/i, ''),
    url: pageUrl
  }
}

/**
 * Fetch data for `ProjectStatus`. Fetches project properties, status report list properties,
 * status reports, project status sections, project column config, and project status list fields.
 * If the selected report is published, the attachments for the report are also fetched.
 */
const fetchData: DataFetchFunction<IProjectStatusProps, FetchDataResult> = async (props) => {
  try {
    if (!SPDataAdapter.isConfigured) {
      await SPDataAdapter.configure(props.spfxContext, {
        siteId: props.siteId,
        webUrl: props.webAbsoluteUrl,
        logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
      })
    }

    const properties = await SPDataAdapter.project.getProjectInformationData()

    if (SPDataAdapter.portalDataService?.isAvailable === false) {
      throw new Error(strings.ProjectStatusNoHubAccessErrorText)
    }

    // Force an explicit hub list access check so no-hub users do not fall through to
    // the regular "no reports" state when portal calls return empty results.
    await SPDataAdapter.portalDataService.web.lists
      .getByTitle(resource.Lists_StatusSections_Title)
      .items.select('Id')
      .top(1)()

    const statusPage = props.useSeparateReportSeries ? await getStatusPageInfo(props) : null

    const [reportList, reports, sections, columnConfig] = await Promise.all([
      SPDataAdapter.portalDataService.getStatusReportListProps(),
      SPDataAdapter.portalDataService.getStatusReports({
        useCaching: false,
        statusPageId: statusPage ? statusPage.id : null
      }),
      SPDataAdapter.portalDataService.getProjectStatusSections(),
      SPDataAdapter.portalDataService.getProjectColumnConfig()
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
      initialSelectedReport = await SPDataAdapter.portalDataService.getStatusReportAttachments(
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
        userHasAdminPermission,
        statusPage
      },
      initialSelectedReport,
      sourceUrl
    }
  } catch (error) {
    if (isNoHubError(error)) {
      throw new Error(strings.ProjectStatusNoHubAccessErrorText)
    }

    throw new Error(strings.ProjectStatusDataErrorText)
  }
}

/**
 * Fetch hook for `ProjectStatus`. Only fetches data on mount using
 * `useEffect` with an empty dependency array.
 *
 * @param props Component properties for `ProjectStatus`
 * @param refetch Timestamp for refetch. Changes to this variable refetches the data in `useEffect`
 * @param dispatch Dispatcer
 */
export const useProjectStatusDataFetch = (
  props: IProjectStatusProps,
  refetch: number,
  dispatch: React.Dispatch<AnyAction>
) => {
  useEffect(() => {
    fetchData(props)
      .then((data) => dispatch(INIT_DATA(data)))
      .catch((error) => {
        dispatch(
          FETCH_DATA_ERROR({
            error: CustomError.createError(
              error instanceof Error ? error : new Error(String(error)),
              MessageBarType.warning
            )
          })
        )
      })
  }, [refetch])
}
