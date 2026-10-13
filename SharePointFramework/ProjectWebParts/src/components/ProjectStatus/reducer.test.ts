import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import { formatDate } from 'pp365-shared-library/lib/util'
import reducer, {
  CLEAR_USER_MESSAGE,
  CLOSE_PANEL,
  FETCH_DATA_ERROR,
  INIT_DATA,
  OPEN_PANEL,
  PERSIST_SECTION_DATA,
  REFETCH_DATA,
  REPORT_DELETED,
  REPORT_DELETE_ERROR,
  REPORT_PUBLISHED,
  REPORT_PUBLISHING,
  REPORT_PUBLISH_ERROR,
  SELECT_REPORT,
  SELECT_SCOPE,
  initialState
} from './reducer'
import { report, section } from './testFixtures'

/**
 * The status page's state rules: the fetched data and the report it opens with, selecting a
 * report, switching report series, publishing and deleting (and their failures), the message shown
 * after publishing, the section data a report remembers, the panel, refetching, and a failed fetch.
 */
const published = report({ GtStatusTime: 'Grønn' }, { id: 2 })
const draft = report({ GtStatusTime: 'Gul' }, { id: 3, published: false })
const data = {
  reports: [draft, published],
  sections: [section(1, 'Fremdrift', 'GtStatusTime')],
  columnConfig: [],
  reportFields: [],
  userHasAdminPermission: true
} as any

const init = (selected: any) =>
  reducer(
    initialState,
    INIT_DATA({ data, initialSelectedReport: selected, sourceUrl: '/sites/hub', resolvedScope: '' })
  )

describe('ProjectStatus reducer', () => {
  it('starts without data loaded and with six placeholder sections', () => {
    expect(initialState.isDataLoaded).toBeUndefined()
    expect(initialState.data.sections).toHaveLength(6)
  })

  it('takes the fetched data, opens the given report and names its status', () => {
    const state = init(published)
    expect(state.isDataLoaded).toBe(true)
    expect(state.selectedReport).toBe(published)
    expect(state.mostRecentReportId).toBe(3)
    expect(state.userHasAdminPermission).toBe(true)
    expect(state.sourceUrl).toBe('/sites/hub')
    expect(state.reportStatus).toBe(
      format(strings.PublishedStatusReport, formatDate(published.publishedDate))
    )
    expect(init(draft).reportStatus).toBe(
      format(strings.NotPublishedStatusReport, formatDate(draft.modified))
    )
  })

  it('selects another report and replaces it in the list', () => {
    const updated = report({ GtStatusTime: 'Rød' }, { id: 2 })
    const state = reducer(init(draft), SELECT_REPORT({ report: updated }))
    expect(state.selectedReport).toBe(updated)
    expect(state.data.reports.map((r) => r.id)).toEqual([3, 2])
    expect(state.data.reports[1]).toBe(updated)
  })

  it('switching report series clears the report, the messages and the remembered section data, and refetches', () => {
    const loaded = reducer(
      init(published),
      PERSIST_SECTION_DATA({ section: { id: 1 } as any, data: { items: [1] } })
    )
    expect(loaded.persistedSectionData).toEqual({ 1: { items: [1] } })
    const state = reducer(loaded, SELECT_SCOPE({ scopeKey: 'DP1' }))
    expect(state.selectedScope).toBe('DP1')
    expect(state.selectedReport).toBeNull()
    expect(state.persistedSectionData).toEqual({})
    expect(state.isDataLoaded).toBe(false)
    expect(state.refetch).toBeGreaterThanOrEqual(loaded.refetch)
  })

  it('publishing marks the page busy, then swaps in the published report with a message', () => {
    const busy = reducer(init(draft), REPORT_PUBLISHING())
    expect(busy.isPublishing).toBe(true)
    const publishedDraft = report({ GtStatusTime: 'Gul' }, { id: 3 })
    const state = reducer(
      busy,
      REPORT_PUBLISHED({
        updatedReport: publishedDraft,
        message: { text: 'Publisert', intent: 'success' }
      })
    )
    expect(state.isPublishing).toBe(false)
    expect(state.selectedReport).toBe(publishedDraft)
    expect(state.data.reports[0]).toBe(publishedDraft)
    expect(state.userMessage).toEqual({ text: 'Publisert', intent: 'success' })
  })

  it('a failed publish ends the busy state and shows why, keeping the report as it was', () => {
    const busy = reducer(init(draft), REPORT_PUBLISHING())
    const state = reducer(
      busy,
      REPORT_PUBLISH_ERROR({ message: { text: 'Kunne ikke publisere', intent: 'error' } })
    )
    expect(state.isPublishing).toBe(false)
    expect(state.userMessage).toEqual({ text: 'Kunne ikke publisere', intent: 'error' })
    expect(state.selectedReport).toBe(draft)
    expect(state.refetch).toBe(busy.refetch)
  })

  it('clears the message shown after publishing, and nothing else', () => {
    const shown = reducer(
      init(published),
      REPORT_PUBLISH_ERROR({ message: { text: 'Kunne ikke publisere', intent: 'error' } })
    )
    const state = reducer(shown, CLEAR_USER_MESSAGE())
    expect(state.userMessage).toBeNull()
    expect(state.selectedReport).toBe(published)
    expect(state.refetch).toBe(shown.refetch)
  })

  it('deleting the selected report opens the next one', () => {
    const state = reducer(init(draft), REPORT_DELETED())
    expect(state.data.reports.map((r) => r.id)).toEqual([2])
    expect(state.selectedReport).toBe(published)
    expect(state.mostRecentReportId).toBe(2)
  })

  it('a failed delete shows why in a message above the report, and keeps the report', () => {
    const state = reducer(init(draft), REPORT_DELETE_ERROR({ error: { message: 'Ingen tilgang' } }))
    expect(state.userMessage).toEqual({
      title: strings.DeleteReportErrorTitle,
      text: 'Ingen tilgang',
      intent: 'error'
    })
    // `error` replaces the whole page; a failed delete leaves the page as it was.
    expect(state.error).toBeUndefined()
    expect(state.selectedReport).toBe(draft)
    expect(state.data.reports.map((r) => r.id)).toEqual([3, 2])
  })

  it('a failed delete without a payload or a reason still shows the message', () => {
    const state = reducer(init(draft), REPORT_DELETE_ERROR())
    expect(state.userMessage).toEqual({
      title: strings.DeleteReportErrorTitle,
      text: undefined,
      intent: 'error'
    })
    expect(state.error).toBeUndefined()
  })

  it('opens and closes the panel, refetching on close', () => {
    const open = reducer(init(published), OPEN_PANEL({ name: 'EditStatusPanel' }))
    expect(open.activePanel).toEqual({ name: 'EditStatusPanel' })
    const closed = reducer(open, CLOSE_PANEL())
    expect(closed.activePanel).toBeNull()
    expect(closed.refetch).toBeGreaterThanOrEqual(open.refetch)
  })

  it('asks for the data again, and changes nothing else', () => {
    const before = Date.now()
    const loaded = { ...init(published), refetch: 0 }
    const state = reducer(loaded, REFETCH_DATA())
    expect(state.refetch).toBeGreaterThanOrEqual(before)
    expect({ ...state, refetch: 0 }).toEqual(loaded)
  })

  it('keeps the error of a failed fetch and ends loading', () => {
    const state = reducer(initialState, FETCH_DATA_ERROR({ error: { message: 'Feil' } as any }))
    expect(state.error.message).toBe('Feil')
    expect(state.isDataLoaded).toBe(true)
  })
})
