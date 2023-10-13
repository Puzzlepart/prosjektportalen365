/* eslint-disable prefer-spread */
import { createAction, createReducer } from '@reduxjs/toolkit'
import _ from 'lodash'
import { IUserMessageProps } from 'pp365-shared-library/lib/components/UserMessage/types'
import { SectionModel, StatusReport } from 'pp365-shared-library/lib/models'
import { getUrlParam } from 'pp365-shared-library/lib/util'
import { FetchDataResult, IProjectStatusState } from './types'

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
 * `REPORT_DELETE_ERROR`: Dispatched by `useDeleteReport` when a report fails to delete.
 */
export const REPORT_DELETE_ERROR = createAction<{ error: any }>('REPORT_DELETE_ERROR')

/**
 * `SELECT_REPORT`: Dispatched by `useSelectReport` when a report is selected.
 */
export const SELECT_REPORT = createAction<{ report: StatusReport }>('SELECT_REPORT')

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
export const OPEN_PANEL = createAction<string>('OPEN_PANEL')

/**
 * `CLOSE_PANEL`: Dispatched anywhere to close the panel. No payload needed for this action
 * as there's only one panel active at a time.
 */
export const CLOSE_PANEL = createAction('CLOSE_PANEL')

/**
 * The initial state for the project status reducer.
 */
export const initialState: IProjectStatusState = {
  isDataLoaded: false,
  selectedReport: new StatusReport({}),
  data: {
    reports: [],
    sections: Array.apply(null, Array(6)).map(() => new SectionModel({ ContentTypeId: '' })),
    columnConfig: []
  },
  persistedSectionData: {}
}

/**
 * Creates a reducer for the project status component.
 *
 * @param state - The current state of the project status.
 * @param action - The action to be performed on the project status.
 *
 * @returns The new state of the project status.
 */
const createProjectStatusReducer = createReducer(initialState, {
  [INIT_DATA.type]: (state: IProjectStatusState, { payload }: ReturnType<typeof INIT_DATA>) => {
    state.sourceUrl = payload.sourceUrl
    state.data = payload.data
    state.selectedReport = payload.initialSelectedReport
    state.mostRecentReportId = _.first(payload.data.reports)?.id ?? 0
    state.userHasAdminPermission = payload.data.userHasAdminPermission
    state.isDataLoaded = true
  },
  [REPORT_PUBLISHING.type]: (state: IProjectStatusState) => {
    state.isPublishing = true
  },
  [REPORT_PUBLISHED.type]: (
    state: IProjectStatusState,
    { payload }: ReturnType<typeof REPORT_PUBLISHED>
  ) => {
    const reports = state.data.reports.map((r) => {
      return payload.updatedReport.id === r.id ? payload.updatedReport : r
    })
    state.data = { ...state.data, reports }
    state.selectedReport = payload.updatedReport
    state.userMessage = payload.message
    state.isPublishing = false
  },
  REPORT_PUBLISH_ERROR: (
    state: IProjectStatusState,
    { payload }: ReturnType<typeof REPORT_PUBLISH_ERROR>
  ) => {
    state.isPublishing = false
    state.userMessage = payload.message
  },
  [REPORT_DELETED.type]: (state: IProjectStatusState) => {
    const reports = state.data.reports.filter((r) => r.id !== state.selectedReport.id)
    state.data = { ...state.data, reports }
    state.selectedReport = _.first(reports)
    state.sourceUrl = decodeURIComponent(getUrlParam('Source') ?? '')
    state.mostRecentReportId = state.selectedReport?.id ?? 0
  },
  [REPORT_DELETE_ERROR.type]: (
    state: IProjectStatusState,
    { payload }: ReturnType<typeof REPORT_DELETE_ERROR>
  ) => {
    state.error = payload.error
  },
  [SELECT_REPORT.type]: (
    state: IProjectStatusState,
    { payload }: ReturnType<typeof SELECT_REPORT>
  ) => {
    state.data.reports = state.data.reports.map((r) =>
      payload.report.id === r.id ? payload.report : r
    )
    state.selectedReport = payload.report
    state.isDataLoaded = true
  },
  [PERSIST_SECTION_DATA.type]: (
    state: IProjectStatusState,
    { payload }: ReturnType<typeof PERSIST_SECTION_DATA>
  ) => {
    state.persistedSectionData = {
      ...state.persistedSectionData,
      [payload.section.id]: payload.data
    }
  },
  [CLEAR_USER_MESSAGE.type]: (state: IProjectStatusState) => {
    state.userMessage = null
  },
  [OPEN_PANEL.type]: (state: IProjectStatusState, { payload }: ReturnType<typeof OPEN_PANEL>) => {
    state.activePanel = payload
  },
  [CLOSE_PANEL.type]: (state: IProjectStatusState) => {
    state.activePanel = null
  }
})

export default createProjectStatusReducer
