import strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'
import createReducer, {
  CHANGE_VIEW,
  COLUMN_DELETED,
  COLUMN_FORM_PANEL_ON_SAVED,
  DATA_FETCHED,
  DATA_FETCH_ERROR,
  EXECUTE_SEARCH,
  ON_FILTER_CHANGED,
  SELECTION_CHANGED,
  SET_GROUP_BY,
  SET_SORT,
  TOGGLE_COLUMN_CONTEXT_MENU,
  TOGGLE_COMPACT,
  TOGGLE_EDIT_VIEW_COLUMNS_PANEL,
  TOGGLE_FILTER_PANEL,
  getInitialState
} from './index'

/**
 * The overview's state rules: search, filters, grouping, sorting per data type (including a
 * column's custom order), the selection, the column context menu, the data fetched for a view and
 * the column form's results. The list renders what this produces, so these must hold through the
 * list's conversion.
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
    const selected = reducer(
      state,
      SELECTION_CHANGED({ getSelection: () => [{ Title: 'Alfa' }] } as any)
    )
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
})
