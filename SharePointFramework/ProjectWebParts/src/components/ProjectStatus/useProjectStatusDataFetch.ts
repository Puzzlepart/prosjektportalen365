import { MessageBarType } from '@fluentui/react'
import { LogLevel } from '@pnp/logging'
import { AnyAction } from '@reduxjs/toolkit'
import strings from 'ProjectWebPartsStrings'
import _ from 'lodash'
import {
  CustomError,
  EditableSPField,
  ProjectAdminPermission,
  StatusReport,
  getAllScopesFilter,
  getScopeSeriesKey,
  getUrlParam,
  isUnauthorizedError,
  parseUrlHash
} from 'pp365-shared-library'
import resource from 'SharedResources'
import { useEffect } from 'react'
import SPDataAdapter from '../../data'
import { isValidScopeKey, parseSubProjects } from './parseSubProjects'
import { FETCH_DATA_ERROR, INIT_DATA } from './reducer'
import { FetchDataResult, IProjectStatusProps } from './types'

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
 * Gets the report ID from the URL hash (`#selectedReport=`) or query
 * parameter (`?selectedReport=`), hash winning. Returns `null` when neither
 * is present.
 */
function getReportIdFromUrl(): number {
  const hashState = parseUrlHash()
  if (hashState.has('selectedReport')) {
    return hashState.get('selectedReport') as number
  }
  const selectedReportUrlParam = getUrlParam('selectedReport')
  if (selectedReportUrlParam) {
    return parseInt(selectedReportUrlParam, 10)
  }
  return null
}

/**
 * Resolves which report scope ("delprosjekt") to show. An explicitly selected
 * scope (any refetch after the initial load) wins. On the initial load a
 * `selectedReport` URL parameter/hash takes precedence — the report's own
 * scope is used so deep links always land on the right series — otherwise the
 * `scope` URL query parameter is used. The URL-supplied scope is validated
 * with the same rules as configured sub-project keys, and is only accepted
 * when it matches a series with existing reports, or (with multi-reporting
 * enabled) a configured sub-project — unknown or invalid values fall back to
 * the default report series, so a crafted URL can never activate an
 * arbitrary scope key.
 *
 * @param selectedScope Explicitly selected scope from state (undefined on initial load)
 * @param allReports All of the project's status reports (all series)
 * @param props Component properties for `ProjectStatus`
 */
function resolveScope(
  selectedScope: string,
  allReports: StatusReport[],
  props: IProjectStatusProps
): string {
  if (selectedScope !== undefined) return selectedScope
  const reportIdFromUrl = getReportIdFromUrl()
  const reportFromUrl =
    reportIdFromUrl !== null
      ? _.find(allReports, (report) => report.id === reportIdFromUrl)
      : undefined
  if (reportFromUrl) return reportFromUrl.scopeKey
  const urlScope = (getUrlParam('scope') ?? '').trim()
  if (!isValidScopeKey(urlScope)) return ''
  const matchesUrlScope = (key: string) => getScopeSeriesKey(key) === getScopeSeriesKey(urlScope)
  if (allReports.some((report) => matchesUrlScope(report.scopeKey))) return urlScope
  const isConfiguredScope =
    props.multiReporting &&
    parseSubProjects(props.subProjects).some(({ key }) => matchesUrlScope(key))
  return isConfiguredScope ? urlScope : ''
}

/**
 * Fetch data for `ProjectStatus`. Fetches project properties, status report list properties,
 * status reports (all report series in one query, then filtered to the resolved scope),
 * project status sections, project column config, and project status list fields.
 * If the selected report is published, the attachments for the report are also fetched.
 *
 * @param props Component properties for `ProjectStatus`
 * @param selectedScope Explicitly selected scope from state (undefined on initial load)
 */
async function fetchData(
  props: IProjectStatusProps,
  selectedScope: string
): Promise<FetchDataResult> {
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

    const reportFields = await getReportFields(
      properties.templateParameters?.ProjectStatusContentTypeId
    )
    const userFieldNames = reportFields
      .filter((field) => field.type === 'User' || field.type === 'UserMulti')
      .map((field) => field.internalName)

    const [reportList, allReports, sections, columnConfig] = await Promise.all([
      SPDataAdapter.portalDataService.getStatusReportListProps(),
      SPDataAdapter.portalDataService.getStatusReports({
        useCaching: false,
        filter: getAllScopesFilter(props.siteId),
        userFields: userFieldNames
      }),
      SPDataAdapter.portalDataService.getProjectStatusSections(),
      SPDataAdapter.portalDataService.getProjectColumnConfig()
    ])

    const userHasAdminPermission = await SPDataAdapter.checkProjectAdminPermissions(
      ProjectAdminPermission.ProjectStatusAdmin,
      properties.fieldValues
    )

    const scopeKeysWithReports = allReports.reduce<string[]>((keys, report) => {
      const scopeKey = report.scopeKey
      if (
        scopeKey &&
        !keys.some((key) => getScopeSeriesKey(key) === getScopeSeriesKey(scopeKey))
      ) {
        keys.push(scopeKey)
      }
      return keys
    }, [])

    const resolvedScope = resolveScope(selectedScope, allReports, props)

    let sortedReports = allReports
      .filter((report) => getScopeSeriesKey(report.scopeKey) === getScopeSeriesKey(resolvedScope))
      .sort((a, b) => b.created.getTime() - a.created.getTime())
    const sortedSections = sections.sort((a, b) => (a.sortOrder < b.sortOrder ? -1 : 1))
    let [initialSelectedReport] = sortedReports
    const sourceUrl = decodeURIComponent(getUrlParam('Source') ?? '')

    // Only honor the `selectedReport` URL parameter when the report exists in
    // the current report series — a failed lookup (report in another series,
    // or deleted) must not clear the default selection.
    const reportIdFromUrl = getReportIdFromUrl()
    const reportFromUrl =
      reportIdFromUrl !== null
        ? _.find(sortedReports, (report) => report.id === reportIdFromUrl)
        : undefined
    if (reportFromUrl) {
      initialSelectedReport = reportFromUrl
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
        reportListId: reportList.Id,
        reports: sortedReports,
        sections: sortedSections,
        columnConfig,
        userHasAdminPermission,
        scopeKeysWithReports
      },
      initialSelectedReport,
      sourceUrl,
      resolvedScope
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
 * `useEffect` with the `refetch` timestamp as dependency.
 *
 * @param props Component properties for `ProjectStatus`
 * @param refetch Timestamp for refetch. Changes to this variable refetches the data in `useEffect`
 * @param selectedScope The currently selected report scope (undefined until the initial load resolves it)
 * @param dispatch Dispatcer
 */
export const useProjectStatusDataFetch = (
  props: IProjectStatusProps,
  refetch: number,
  selectedScope: string,
  dispatch: React.Dispatch<AnyAction>
) => {
  useEffect(() => {
    fetchData(props, selectedScope)
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
