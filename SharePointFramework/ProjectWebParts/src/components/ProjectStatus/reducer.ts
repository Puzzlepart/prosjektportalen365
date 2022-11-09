/* eslint-disable prefer-spread */
import { createAction, createReducer } from '@reduxjs/toolkit'
import _ from 'lodash'
import { SectionModel, StatusReport } from 'pp365-shared/lib/models'
import { getUrlParam, parseUrlHash } from 'pp365-shared/lib/util'
import { IProjectStatusData, IProjectStatusHashState, IProjectStatusState } from './types'

export const INIT_DATA = createAction<{ data: IProjectStatusData }>('INIT_DATA')
export const REPORT_PUBLISHING = createAction('REPORT_PUBLISHING')
export const REPORT_PUBLISHED = createAction<{ updatedReport: StatusReport }>('REPORT_PUBLISHED')
export const REPORT_DELETED = createAction('REPORT_DELETED')
export const REPORT_DELETE_ERROR = createAction<{ error: any }>('REPORT_DELETE_ERROR')
export const SELECT_REPORT = createAction<{ report: StatusReport }>('SELECT_REPORT')
export const PERSIST_SECTION_DATA = createAction<{ section: SectionModel; data: any }>(
  'PERSIST_SECTION_DATA'
)

export const initialState: IProjectStatusState = {
  isDataLoaded: false,
  selectedReport: new StatusReport({}),
  data: {
    reports: [],
    sections: Array.apply(null, Array(6)).map(() => new SectionModel({ ContentTypeId: '' })),
    columnConfig: []
  },
  persistListData: {}
}

export default createReducer(initialState, {
  [INIT_DATA.type]: (state, { payload }: ReturnType<typeof INIT_DATA>) => {
    let [selectedReport] = payload.data.reports
    const hashState = parseUrlHash<IProjectStatusHashState>()
    const selectedReportUrlParam = getUrlParam('selectedReport')
    state.sourceUrl = decodeURIComponent(getUrlParam('Source') ?? '')
    if (hashState.selectedReport) {
      selectedReport = _.find(
        payload.data.reports,
        (report) => report.id === parseInt(hashState.selectedReport, 10)
      )
    } else if (selectedReportUrlParam) {
      selectedReport = _.find(
        payload.data.reports,
        (report) => report.id === parseInt(selectedReportUrlParam, 10)
      )
    }
    state.data = payload.data
    state.selectedReport = selectedReport
    state.mostRecentReportId = _.first(payload.data.reports)?.id ?? 0
    state.userHasAdminPermission = payload.data.userHasAdminPermission
    state.isDataLoaded = true
  },
  [REPORT_PUBLISHING.type]: (state) => {
    state.isPublishing = true
  },
  [REPORT_PUBLISHED.type]: (state, { payload }: ReturnType<typeof REPORT_PUBLISHED>) => {
    const reports = state.data.reports.map((r) => {
      return payload.updatedReport.id === r.id ? payload.updatedReport : r
    })
    state.data = { ...state.data, reports }
    state.selectedReport = payload.updatedReport
  },
  [REPORT_DELETED.type]: (state) => {
    const reports = state.data.reports.filter((r) => r.id !== state.selectedReport.id)
    state.data = { ...state.data, reports }
    state.selectedReport = _.first(reports)
    state.sourceUrl = decodeURIComponent(getUrlParam('Source') ?? '')
    state.mostRecentReportId = state.selectedReport?.id ?? 0
  },
  [REPORT_DELETE_ERROR.type]: (state, { payload }: ReturnType<typeof REPORT_DELETE_ERROR>) => {
    state.error = payload.error
  },
  [SELECT_REPORT.type]: (state, { payload }: ReturnType<typeof SELECT_REPORT>) => {
    state.selectedReport = payload.report
  },
  [PERSIST_SECTION_DATA.type]: (state, { payload }: ReturnType<typeof PERSIST_SECTION_DATA>) => {
    state.persistListData = {
      ...state.persistListData,
      [payload.section.id]: payload.data
    }
  }
})
