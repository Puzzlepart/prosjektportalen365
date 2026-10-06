import strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'
import createReducer, {
  CHANGE_VIEW,
  COLUMN_DELETED,
  COLUMN_FORM_PANEL_ON_SAVED,
  DATA_FETCHED,
  DATA_FETCH_ERROR,
  EXCEL_EXPORT_ERROR,
  EXCEL_EXPORT_SUCCESS,
  EXECUTE_SEARCH,
  ON_FILTER_CHANGED,
  SELECTION_CHANGED,
  SET_GROUP_BY,
  SET_SORT,
  SET_VIEW_FORM_PANEL,
  START_EXCEL_EXPORT,
  STARTING_DATA_FETCH,
  TOGGLE_COLUMN_CONTEXT_MENU,
  TOGGLE_COLUMN_FORM_PANEL,
  TOGGLE_COMPACT,
  TOGGLE_EDIT_VIEW_COLUMNS_PANEL,
  TOGGLE_FILTER_PANEL,
  TOGGLE_MERGED_VIEW,
  getInitialState
} from './index'

/**
 * The overview's state rules: loading, search, filters, grouping, sorting per data type (including
 * a column's custom order), the selection, the column context menu, the data fetched for a view,
 * the merged view of all projects, the Excel export's progress and the column and view forms'
 * results. The list renders what this produces, so these must hold through the list's conversion
 * and the reducer's rewrites.
 */
const column = (fieldName: string, name: string, extra: Record<string, any> = {}) =>
  ({ key: fieldName, fieldName, name, minWidth: 100, dataType: 'text', ...extra }) as any

const title = column('Title', 'Tittel')
const phase = column('GtProjectPhase', 'Fase')
const budget = column('GtBudgetTotal', 'Budsjett', { dataType: 'number' })
const params = { props: {} as any, placeholderColumns: [title, phase] }
const view = (extra: Record<string, any> = {}) =>
  ({ id: 1, title: 'Alle prosjekter', columns: [title, phase], columnOrder: [], ...extra }) as any

function setup(state: Record<string, any> = {}) {
  const reducer = createReducer(params)
  return { reducer, state: { ...getInitialState(params), ...state } as any }
}

const titles = (state: any) => state.items.map((i: any) => i.Title)

describe('PortfolioOverview reducer', () => {
  it('starts loading with the placeholder columns and no open panels', () => {
    const state = getInitialState(params)
    expect(state.loading).toBe(true)
    expect(state.columns).toEqual([title, phase])
    expect(state.columnForm.isOpen).toBe(false)
    expect(state.viewForm.isOpen).toBe(false)
    expect(state.columnContextMenu).toBeNull()
  })

  it('stores the fetched data for the view and stops loading', () => {
    const { reducer, state } = setup()
    const next = reducer(
      state,
      DATA_FETCHED({
        items: [{ Title: 'Alfa' }],
        currentView: view({ columns: [title] }),
        groupBy: phase,
        managedProperties: ['Title'],
        isUserInPortfolioManagerGroup: true,
        showChildProjectInfoInProgram: false
      })
    )
    expect(next.loading).toBe(false)
    expect(next.error).toBeNull()
    expect(titles(next)).toEqual(['Alfa'])
    expect(next.columns).toEqual([title])
    expect(next.groupBy).toEqual(phase)
    expect(next.isUserInPortfolioManagerGroup).toBe(true)
    expect(document.location.hash).toBe('#viewId=1')
  })

  it('keeps the error, named after the view, when the fetch fails', () => {
    const { reducer, state } = setup()
    const next = reducer(
      state,
      DATA_FETCH_ERROR({ error: new Error('Kilden svarte ikke'), view: view() })
    )
    expect(next.loading).toBe(false)
    expect(next.error.message).toBe(
      format(strings.PortfolioOverviewDataFetchErrorView, 'Alle prosjekter', 'Kilden svarte ikke')
    )
    const withoutView = reducer(
      state,
      DATA_FETCH_ERROR({ error: new Error('Kilden svarte ikke'), view: undefined })
    )
    expect(withoutView.error.message).toBe(
      format(strings.PortfolioOverviewDataFetchError, 'Kilden svarte ikke')
    )
  })

  it('lowercases the search term and toggles the panels and compact mode', () => {
    const { reducer, state } = setup()
    expect(reducer(state, EXECUTE_SEARCH('Konsept')).searchTerm).toBe('konsept')
    expect(reducer(state, TOGGLE_FILTER_PANEL()).isFilterPanelOpen).toBe(true)
    expect(
      reducer(reducer(state, TOGGLE_FILTER_PANEL()), TOGGLE_FILTER_PANEL()).isFilterPanelOpen
    ).toBe(false)
    expect(reducer(state, TOGGLE_COMPACT()).isCompact).toBe(true)
  })

  it('adds a filter from its selected items and removes it when nothing is selected', () => {
    const { reducer, state } = setup()
    const withFilter = reducer(
      state,
      ON_FILTER_CHANGED({
        column: phase,
        selectedItems: [{ value: 'Konsept' }, { value: 'Planlegge' }] as any
      })
    )
    expect(withFilter.activeFilters).toEqual({ GtProjectPhase: ['Konsept', 'Planlegge'] })
    const cleared = reducer(withFilter, ON_FILTER_CHANGED({ column: phase, selectedItems: [] }))
    expect(cleared.activeFilters).toEqual({})
  })

  it('groups by a column and ungroups when the same column is chosen again', () => {
    const { reducer, state } = setup()
    const grouped = reducer(state, SET_GROUP_BY(phase))
    expect(grouped.groupBy).toEqual(phase)
    expect(reducer(grouped, SET_GROUP_BY(phase)).groupBy).toBeNull()
    expect(reducer(grouped, SET_GROUP_BY(title)).groupBy).toEqual(title)
  })

  it('sorts text columns both ways and marks the sorted column', () => {
    const { reducer, state } = setup({
      items: [{ Title: 'Bravo' }, { Title: 'alfa' }, { Title: 'Charlie' }]
    })
    // `isSortedDescending: true` is the "A til Å" choice of the column menu: ascending.
    const ascending = reducer(state, SET_SORT({ column: title, isSortedDescending: true }))
    expect(titles(ascending)).toEqual(['alfa', 'Bravo', 'Charlie'])
    expect(ascending.columns.map((c: any) => [c.isSorted, c.isSortedDescending])).toEqual([
      [true, true],
      [false, false]
    ])
    expect(ascending.sortBy.column.key).toBe('Title')
    const descending = reducer(ascending, SET_SORT({ column: title, isSortedDescending: false }))
    expect(titles(descending)).toEqual(['Charlie', 'Bravo', 'alfa'])
    // Without an explicit direction the column's current direction is flipped.
    const flipped = reducer(
      descending,
      SET_SORT({ column: { ...title, isSortedDescending: false } })
    )
    expect(titles(flipped)).toEqual(['alfa', 'Bravo', 'Charlie'])
  })

  it('sorts number columns numerically', () => {
    const { reducer, state } = setup({
      items: [
        { Title: 'Ti', GtBudgetTotal: 10 },
        { Title: 'To', GtBudgetTotal: 2 },
        { Title: 'Hundre', GtBudgetTotal: 100 }
      ]
    })
    expect(titles(reducer(state, SET_SORT({ column: budget, isSortedDescending: true })))).toEqual([
      'To',
      'Ti',
      'Hundre'
    ])
    expect(titles(reducer(state, SET_SORT({ column: budget, isSortedDescending: false })))).toEqual(
      ['Hundre', 'Ti', 'To']
    )
  })

  it('sorts by a custom order of the column', () => {
    const { reducer, state } = setup({
      items: [
        { Title: 'Alfa', GtProjectPhase: 'Realisere' },
        { Title: 'Bravo', GtProjectPhase: 'Konsept' },
        { Title: 'Charlie', GtProjectPhase: 'Planlegge' }
      ]
    })
    const customSort = { name: 'Fasene i rekkefølge', order: ['Konsept', 'Planlegge', 'Realisere'] }
    const sorted = reducer(state, SET_SORT({ column: phase, customSort, isSortedDescending: true }))
    expect(titles(sorted)).toEqual(['Bravo', 'Charlie', 'Alfa'])
    expect(sorted.sortBy.customSort).toEqual(customSort)
    expect(
      titles(reducer(state, SET_SORT({ column: phase, customSort, isSortedDescending: false })))
    ).toEqual(['Alfa', 'Charlie', 'Bravo'])
  })

  it('keeps the selected items and the open column menu', () => {
    const { reducer, state } = setup()
    const selected = reducer(state, SELECTION_CHANGED([{ Title: 'Alfa' }]))
    expect(selected.selectedItems).toEqual([{ Title: 'Alfa' }])
    const target = document.createElement('div')
    expect(
      reducer(state, TOGGLE_COLUMN_CONTEXT_MENU({ column: phase, target })).columnContextMenu
    ).toEqual({
      column: phase,
      target
    })
  })

  it('changes the view and its columns', () => {
    const { reducer, state } = setup({ currentView: view() })
    const next = reducer(
      state,
      CHANGE_VIEW(view({ id: 2, title: 'Mine prosjekter', columns: [title] }))
    )
    expect(next.isChangingView).toBe(true)
    expect(next.currentView.title).toBe('Mine prosjekter')
    expect(next.columns).toEqual([title])
    expect(document.location.hash).toBe('#viewId=2')
  })

  it('adds a saved column last, also in the view order, and replaces an edited one', () => {
    const { reducer, state } = setup({ currentView: view({ columnOrder: [1, 2] }) })
    const added = reducer(
      state,
      COLUMN_FORM_PANEL_ON_SAVED({ column: { ...budget, id: 3 }, isNew: true })
    )
    expect(added.columns.map((c: any) => c.key)).toEqual([
      'Title',
      'GtProjectPhase',
      'GtBudgetTotal'
    ])
    expect(added.currentView.columnOrder).toEqual([1, 2, 3])
    expect(added.columnForm.isOpen).toBe(false)
    const edited = reducer(
      added,
      COLUMN_FORM_PANEL_ON_SAVED({ column: { ...phase, name: 'Prosjektfase' }, isNew: false })
    )
    expect(edited.columns.map((c: any) => c.name)).toEqual(['Tittel', 'Prosjektfase', 'Budsjett'])
    const noOrder = reducer(
      setup({ currentView: view() }).state,
      COLUMN_FORM_PANEL_ON_SAVED({ column: { ...budget, id: 3 }, isNew: true })
    )
    expect(noOrder.currentView.columnOrder).toEqual([])
  })

  it('removes a deleted column and takes the columns chosen in the show/hide panel', () => {
    const { reducer, state } = setup({
      currentView: view(),
      columns: [
        { ...title, id: 1 },
        { ...phase, id: 2 }
      ]
    })
    const deleted = reducer(state, COLUMN_DELETED({ columnId: 2 }))
    expect(deleted.columns.map((c: any) => c.key)).toEqual(['Title'])
    const chosen = reducer(
      state,
      TOGGLE_EDIT_VIEW_COLUMNS_PANEL({
        isOpen: false,
        columns: [
          { ...phase, id: 2 },
          { ...title, id: 1 }
        ] as any
      })
    )
    expect(chosen.isEditViewColumnsPanelOpen).toBe(false)
    expect(chosen.columns.map((c: any) => c.key)).toEqual(['GtProjectPhase', 'Title'])
    expect(chosen.currentView.columnOrder).toEqual([2, 1])
    const reverted = reducer(
      state,
      TOGGLE_EDIT_VIEW_COLUMNS_PANEL({
        isOpen: false,
        columns: [{ ...title, id: 1 }] as any,
        revertColumnOrder: true
      })
    )
    expect(reverted.currentView.columnOrder).toEqual([])
  })

  it('shows loading again when a new fetch starts', () => {
    const { reducer, state } = setup({ loading: false, items: [{ Title: 'Alfa' }] })
    const next = reducer(state, STARTING_DATA_FETCH())
    expect(next.loading).toBe(true)
    expect(titles(next)).toEqual(['Alfa'])
  })

  it('marks the Excel export as running until it succeeds or fails, and keeps no error from it', () => {
    const { reducer, state } = setup()
    const exporting = reducer(state, START_EXCEL_EXPORT())
    expect(exporting.isExporting).toBe(true)
    expect(reducer(exporting, EXCEL_EXPORT_SUCCESS()).isExporting).toBe(false)
    const failed = reducer(exporting, EXCEL_EXPORT_ERROR(new Error('Eksporten feilet')))
    expect(failed.isExporting).toBe(false)
    expect(failed.error).toBeUndefined()
  })

  it('opens the view form for a new view or the chosen one, and closes it', () => {
    const { reducer, state } = setup()
    expect(reducer(state, SET_VIEW_FORM_PANEL({ isOpen: true })).viewForm).toEqual({
      isOpen: true
    })
    const chosen = view({ id: 2, title: 'Mine prosjekter' })
    const editing = reducer(state, SET_VIEW_FORM_PANEL({ isOpen: true, view: chosen }))
    expect(editing.viewForm).toEqual({ isOpen: true, view: chosen })
    expect(reducer(editing, SET_VIEW_FORM_PANEL({ isOpen: false })).viewForm).toEqual({
      isOpen: false
    })
  })

  it('switches to the merged view of all projects and back, as a change of view each way', () => {
    const { reducer, state } = setup()
    const merged = reducer(state, TOGGLE_MERGED_VIEW(true))
    expect(merged.isMergedView).toBe(true)
    expect(merged.isChangingView).toBe(true)
    const separate = reducer({ ...merged, isChangingView: false }, TOGGLE_MERGED_VIEW(false))
    expect(separate.isMergedView).toBe(false)
    expect(separate.isChangingView).toBe(true)
  })

  it('opens the column form for a new column or the chosen one, and closes it', () => {
    const { reducer, state } = setup()
    expect(reducer(state, TOGGLE_COLUMN_FORM_PANEL({ isOpen: true })).columnForm).toEqual({
      isOpen: true
    })
    const editing = reducer(state, TOGGLE_COLUMN_FORM_PANEL({ isOpen: true, column: phase }))
    expect(editing.columnForm).toEqual({ isOpen: true, column: phase })
    expect(reducer(editing, TOGGLE_COLUMN_FORM_PANEL({ isOpen: false })).columnForm).toEqual({
      isOpen: false
    })
  })

  it('sorts date, currency and percentage columns by their values', () => {
    const start = column('GtStartDate', 'Startdato', { dataType: 'date' })
    const costs = column('GtCostsTotal', 'Kostnader', { dataType: 'currency' })
    const progress = column('GtProgress', 'Fremdrift', { dataType: 'percentage' })
    const { reducer, state } = setup({
      items: [
        {
          Title: 'Alfa',
          GtStartDate: '2026-05-01T00:00:00Z',
          GtCostsTotal: 'kr 30',
          GtProgress: '50%'
        },
        {
          Title: 'Bravo',
          GtStartDate: '2025-11-15T00:00:00Z',
          GtCostsTotal: 'kr 1000',
          GtProgress: '5%'
        },
        {
          Title: 'Charlie',
          GtStartDate: '2026-01-10T00:00:00Z',
          GtCostsTotal: 'kr 200',
          GtProgress: '100%'
        }
      ]
    })
    const sorted = (c: any, isSortedDescending: boolean) =>
      titles(reducer(state, SET_SORT({ column: c, isSortedDescending })))
    expect(sorted(start, true)).toEqual(['Bravo', 'Charlie', 'Alfa'])
    expect(sorted(start, false)).toEqual(['Alfa', 'Charlie', 'Bravo'])
    expect(sorted(costs, true)).toEqual(['Alfa', 'Charlie', 'Bravo'])
    expect(sorted(costs, false)).toEqual(['Bravo', 'Charlie', 'Alfa'])
    expect(sorted(progress, true)).toEqual(['Bravo', 'Alfa', 'Charlie'])
    expect(sorted(progress, false)).toEqual(['Charlie', 'Alfa', 'Bravo'])
  })

  it('writes the grouping active before the fetch to the address, and takes no managed properties as none', () => {
    window.history.replaceState(null, '', '/')
    const { reducer, state } = setup({ groupBy: title })
    const next = reducer(
      state,
      DATA_FETCHED({
        items: [],
        currentView: view(),
        groupBy: phase,
        managedProperties: undefined,
        isUserInPortfolioManagerGroup: false,
        showChildProjectInfoInProgram: true
      })
    )
    expect(document.location.hash).toBe('#viewId=1&groupBy=Title')
    expect(next.groupBy).toEqual(phase)
    expect(next.managedProperties).toEqual([])
    expect(next.showChildProjectInfoInProgram).toBe(true)
  })

  it('keeps the grouping in the address when the view changes, and names no view when none was open', () => {
    window.history.replaceState(null, '', '/')
    const grouped = setup({ currentView: view(), groupBy: phase })
    grouped.reducer(grouped.state, CHANGE_VIEW(view({ id: 2, title: 'Mine prosjekter' })))
    expect(document.location.hash).toBe('#viewId=2&groupBy=GtProjectPhase')
    window.history.replaceState(null, '', '/')
    const first = setup()
    const next = first.reducer(first.state, CHANGE_VIEW(view({ id: 2, title: 'Mine prosjekter' })))
    expect(next.currentView.title).toBe('Mine prosjekter')
    expect(document.location.hash).toBe('')
  })
})
