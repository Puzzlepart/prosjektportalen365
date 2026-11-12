import { createAction, createReducer } from '@reduxjs/toolkit'
import _ from 'lodash'
import { IUserMessageProps } from 'pp365-shared-library/lib/components/UserMessage/types'
import { SectionModel, StatusReport } from 'pp365-shared-library/lib/models'
import { formatDate, getUrlParam } from 'pp365-shared-library/lib/util'
import { FetchDataResult, IProjectStatusState } from './types'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'

/**
 * Initializes the report series, selected report and loaded configuration.
 */
export const INIT_DATA = createAction<FetchDataResult>('INIT_DATA')

/**
 * Marks the selected report as being published.
 */
export const REPORT_PUBLISHING = createAction('REPORT_PUBLISHING')

/**
 * Applies the published report and its confirmation message.
 */
export const REPORT_PUBLISHED = createAction<{
  updatedReport: StatusReport
  message: Pick<IUserMessageProps, 'text' | 'intent'>
}>('REPORT_PUBLISHED')

/**
 * Ends publishing with a user-facing error message.
 */
export const REPORT_PUBLISH_ERROR = createAction<{
  message: Pick<IUserMessageProps, 'text' | 'intent'>
}>('REPORT_PUBLISH_ERROR')

/**
 * Removes the deleted report and selects the next available one.
 */
export const REPORT_DELETED = createAction('REPORT_DELETED')

/**
 * Shows a deletion error above the report without replacing the page.
 */
export const REPORT_DELETE_ERROR = createAction<{ error: any }>('REPORT_DELETE_ERROR')

/**
 * Selects a report and resets its section-data cache.
 */
export const SELECT_REPORT = createAction<{ report: StatusReport }>('SELECT_REPORT')

/**
 * Switches report series and requests data for the selected scope.
 */
export const SELECT_SCOPE = createAction<{ scopeKey: string }>('SELECT_SCOPE')

/**
 * Caches live section data for the report's published snapshot.
 */
export const PERSIST_SECTION_DATA = createAction<{ section: SectionModel; data: any }>(
  'PERSIST_SECTION_DATA'
)

/**
 * Clears transient report-operation feedback.
 */
export const CLEAR_USER_MESSAGE = createAction('CLEAR_USER_MESSAGE')

/**
 * Opens the status report editor with its supplied field values.
 */
export const OPEN_PANEL = createAction<IProjectStatusState['activePanel']>('OPEN_PANEL')

/**
 * Closes the report editor and requests fresh report data.
 */
export const CLOSE_PANEL = createAction('CLOSE_PANEL')

/**
 * Opens the selected report's snapshot.
 */
export const OPEN_SNAPSHOT = createAction('OPEN_SNAPSHOT')

/**
 * Closes the snapshot without refetching unchanged report data.
 */
export const CLOSE_SNAPSHOT = createAction('CLOSE_SNAPSHOT')

/**
 * Requests fresh report data.
 */
export const REFETCH_DATA = createAction('REFETCH_DATA')

/**
 * Records a failure to load report data.
 */
export const FETCH_DATA_ERROR = createAction<{ error: IProjectStatusState['error'] }>(
  'FETCH_DATA_ERROR'
)

/**
 * The initial state for the project status reducer.
 */
export const initialState: IProjectStatusState = {
  data: {
    reports: [],
    sections: Array.apply(null, Array(6)).map(() => new SectionModel({ ContentTypeId: '' })),
    columnConfig: [],
    reportFields: []
  },
  persistedSectionData: {},
  refetch: new Date().getTime()
}

/**
 * The state of the report beside the web part's title: published and when, or a draft and when it
 * was last changed. Nothing without a report: a series with no report read «Kladd, sist endret ».
 *
 * @param report The report the page shows, if any
 */
function getReportStatus(
  report?: Pick<StatusReport, 'published' | 'publishedDate' | 'modified'>
): string | undefined {
  if (!report) return undefined
  return report.published
    ? format(strings.PublishedStatusReport, formatDate(report.publishedDate))
    : format(strings.NotPublishedStatusReport, formatDate(report.modified))
}

/**
 * Handles report selection, editing, publication and section-data caching.
 */
const createProjectStatusReducer = createReducer(initialState, (builder) =>
  builder
    .addCase(INIT_DATA, (state, { payload }) => {
      state.sourceUrl = payload.sourceUrl
      state.data = payload.data
      state.selectedReport = payload.initialSelectedReport
      state.selectedScope = payload.resolvedScope
      state.mostRecentReportId = _.first(payload.data.reports)?.id ?? 0
      state.userHasAdminPermission = payload.data.userHasAdminPermission
      state.isDataLoaded = true
      state.reportStatus = getReportStatus(payload.initialSelectedReport)
    })
    .addCase(REPORT_PUBLISHING, (state) => {
      state.isPublishing = true
    })
    .addCase(REPORT_PUBLISHED, (state, { payload }) => {
      const reports = state.data.reports.map((r) => {
        return payload.updatedReport.id === r.id ? payload.updatedReport : r
      })
      state.data = { ...state.data, reports }
      state.selectedReport = payload.updatedReport
      state.userMessage = payload.message
      state.refetch = new Date().getTime()
      state.isPublishing = false
    })
    .addCase(REPORT_PUBLISH_ERROR, (state, { payload }) => {
      state.isPublishing = false
      state.userMessage = payload.message
    })
    .addCase(REPORT_DELETED, (state) => {
      const reports = state.data.reports.filter((r) => r.id !== state.selectedReport.id)
      state.data = { ...state.data, reports }
      state.selectedReport = _.first(reports)
      state.sourceUrl = decodeURIComponent(getUrlParam('Source') ?? '')
      state.mostRecentReportId = state.selectedReport?.id ?? 0
      state.refetch = new Date().getTime()
      state.reportStatus = getReportStatus(state.selectedReport)
    })
    .addCase(REPORT_DELETE_ERROR, (state, { payload }) => {
      // A message above the report: `state.error` would replace the whole page.
      state.userMessage = {
        title: strings.DeleteReportErrorTitle,
        text: payload?.error?.message,
        intent: 'error'
      }
    })
    .addCase(SELECT_REPORT, (state, { payload }) => {
      state.data.reports = state.data.reports.map((r) =>
        payload.report.id === r.id ? payload.report : r
      )
      state.selectedReport = payload.report
      state.isDataLoaded = true
      state.reportStatus = getReportStatus(payload.report)
    })
    .addCase(SELECT_SCOPE, (state, { payload }) => {
      state.selectedScope = payload.scopeKey
      state.selectedReport = null
      state.userMessage = null
      state.mostRecentReportId = 0
      // Reset persisted section data so live section data fetched for one
      // report series never leaks into another series' published snapshot.
      state.persistedSectionData = {}
      state.isDataLoaded = false
      state.refetch = new Date().getTime()
    })
    .addCase(PERSIST_SECTION_DATA, (state, { payload }) => {
      state.persistedSectionData = {
        ...state.persistedSectionData,
        [payload.section.id]: payload.data
      }
    })
    .addCase(CLEAR_USER_MESSAGE, (state) => {
      state.userMessage = null
    })
    .addCase(OPEN_PANEL, (state, { payload }) => {
      state.activePanel = payload
    })
    .addCase(CLOSE_PANEL, (state) => {
      state.activePanel = null
      state.refetch = new Date().getTime()
    })
    .addCase(OPEN_SNAPSHOT, (state) => {
      state.isSnapshotOpen = true
    })
    .addCase(CLOSE_SNAPSHOT, (state) => {
      state.isSnapshotOpen = false
    })
    .addCase(REFETCH_DATA, (state) => {
      state.refetch = new Date().getTime()
    })
    .addCase(FETCH_DATA_ERROR, (state, { payload }) => {
      state.error = payload.error
      state.isDataLoaded = true
    })
)

export default createProjectStatusReducer
