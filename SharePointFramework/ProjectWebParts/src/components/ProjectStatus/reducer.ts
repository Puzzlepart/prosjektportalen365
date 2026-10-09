import { createAction, createReducer } from '@reduxjs/toolkit'
import _ from 'lodash'
import { IUserMessageProps } from 'pp365-shared-library/lib/components/UserMessage/types'
import { SectionModel, StatusReport } from 'pp365-shared-library/lib/models'
import { formatDate, getUrlParam } from 'pp365-shared-library/lib/util'
import { FetchDataResult, IProjectStatusState } from './types'
import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'

/**
 * `INIT_DATA`: Dispatched by `useProjectStatusDataFetch` when data is loaded
 */
export const INIT_DATA = createAction<FetchDataResult>('INIT_DATA')

/**
 * `REPORT_PUBLISHING`: Dispatched by `usePublishReport` when a report is being published.
 */
export const REPORT_PUBLISHING = createAction('REPORT_PUBLISHING')

/**
 * `REPORT_PUBLISHED`: Dispatched by `usePublishReport` when a report is published.
 */
export const REPORT_PUBLISHED = createAction<{
  updatedReport: StatusReport
  message: Pick<IUserMessageProps, 'text' | 'intent'>
}>('REPORT_PUBLISHED')

/**
 * `REPORT_PUBLISH_ERROR`: Dispatched by `usePublishReport` when a report fails to publish.
 */
export const REPORT_PUBLISH_ERROR = createAction<{
  message: Pick<IUserMessageProps, 'text' | 'intent'>
}>('REPORT_PUBLISH_ERROR')

/**
 * `REPORT_DELETED`: Dispatched by `useDeleteReport` when a report is deleted.
 */
export const REPORT_DELETED = createAction('REPORT_DELETED')

/**
 * `REPORT_DELETE_ERROR`: Dispatched by `useDeleteReport` when a report fails to delete. Shows the
 * error's message as a user message above the report.
 */
export const REPORT_DELETE_ERROR = createAction<{ error: any }>('REPORT_DELETE_ERROR')

/**
 * `SELECT_REPORT`: Dispatched by `useSelectReport` when a report is selected.
 */
export const SELECT_REPORT = createAction<{ report: StatusReport }>('SELECT_REPORT')

/**
 * `SELECT_SCOPE`: Dispatched by `useScopeSelector` when a report scope
 * ("delprosjekt") is selected. Triggers a refetch scoped to the selected
 * report series.
 */
export const SELECT_SCOPE = createAction<{ scopeKey: string }>('SELECT_SCOPE')

/**
 * `PERSIST_SECTION_DATA`: Dispatched by `usePersistSectionData` when section data is persisted.
 */
export const PERSIST_SECTION_DATA = createAction<{ section: SectionModel; data: any }>(
  'PERSIST_SECTION_DATA'
)

/**
 * `PERSIST_SECTION_DATA_ERROR`: Dispatched anywhere to clear the current user message.
 */
export const CLEAR_USER_MESSAGE = createAction('CLEAR_USER_MESSAGE')

/**
 * `OPEN_PANEL`: Dispatched anywhere to open the panel. The payload is the panel key.
 */
export const OPEN_PANEL = createAction<IProjectStatusState['activePanel']>('OPEN_PANEL')

/**
 * `CLOSE_PANEL`: Dispatched anywhere to close the panel. No payload needed for this action
 * as there's only one panel active at a time.
 */
export const CLOSE_PANEL = createAction('CLOSE_PANEL')

/**
 * `REFETCH_DATA`: Dispatched by ...
 */
export const REFETCH_DATA = createAction('REFETCH_DATA')

/**
 * `FETCH_DATA_ERROR`: Dispatched when initial data loading fails.
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
 * Creates a reducer for the project status component.
 *
 * @param state - The current state of the project status.
 * @param action - The action to be performed on the project status.
 *
 * @returns The new state of the project status.
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

      if (payload.initialSelectedReport?.published) {
        state.reportStatus = format(
          strings.PublishedStatusReport,
          formatDate(payload.initialSelectedReport?.publishedDate)
        )
      } else {
        state.reportStatus = format(
          strings.NotPublishedStatusReport,
          formatDate(payload.initialSelectedReport?.modified)
        )
      }
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
      state.reportStatus = format(
        strings.PublishedStatusReport,
        formatDate(state.selectedReport?.publishedDate)
      )
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

      if (payload.report.published) {
        state.reportStatus = format(
          strings.PublishedStatusReport,
          formatDate(payload.report?.publishedDate)
        )
      } else {
        state.reportStatus = format(
          strings.NotPublishedStatusReport,
          formatDate(payload.report?.modified)
        )
      }
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
    .addCase(REFETCH_DATA, (state) => {
      state.refetch = new Date().getTime()
    })
    .addCase(FETCH_DATA_ERROR, (state, { payload }) => {
      state.error = payload.error
      state.isDataLoaded = true
    })
)

export default createProjectStatusReducer
