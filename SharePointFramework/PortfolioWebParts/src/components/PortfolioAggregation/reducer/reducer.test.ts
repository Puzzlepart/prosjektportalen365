import strings from 'PortfolioWebPartsStrings'
import resource from 'SharedResources'
import { DataSource, ProjectContentColumn, format } from 'pp365-shared-library'
import { IPortfolioAggregationProps } from '../types'
import {
  COLUMN_DELETED,
  COLUMN_FORM_PANEL_ON_SAVED,
  DATA_FETCHED,
  DATA_FETCH_ERROR,
  EXECUTE_SEARCH,
  GET_FILTERS,
  ON_FILTER_CHANGE,
  SELECTION_CHANGED,
  SET_CURRENT_VIEW,
  SET_DATA_SOURCE,
  SET_GROUP_BY,
  SET_SORT,
  SET_VIEW_FORM_PANEL,
  SET_VIEW_GROUP_BY,
  START_FETCH,
  TOGGLE_COLUMN_CONTEXT_MENU,
  TOGGLE_COLUMN_FORM_PANEL,
  TOGGLE_COMPACT,
  TOGGLE_EDIT_VIEW_COLUMNS_PANEL,
  TOGGLE_FILTER_PANEL
} from './actions'
import { createPortfolioAggregationReducer } from './createPortfolioAggregationReducer'
import { getInitialState } from './getInitialState'

/**
 * The aggregated overview's state (deliveries, risks, benefits and so on across the projects): the
 * rows of the current view (data source) sorted, filtered and grouped; the view's columns among all
 * the columns of the category, marked selected for the show/hide panel; which view is current (from
 * the address, the web part properties or the default view); the filter panel's values; and what
 * the column and view forms saved, which the web part also keeps in its properties. The list
 * renders what this produces, so each rule must hold through the reducer's rewrite.
 */
const column = (
  Id: number,
  Title: string,
  fieldName: string,
  extra: Record<string, any> = {}
): ProjectContentColumn =>
  new ProjectContentColumn({
    Id,
    Title,
    GtInternalName: fieldName,
    GtManagedProperty: fieldName,
    GtFieldDataType: 'Text',
    GtColMinWidth: 100,
    GtSortOrder: Id * 10,
    ...extra
  })

/** The category's columns, made per test: the reducer marks content columns selected in place. */
function categoryColumns() {
  return {
    siteTitle: column(1, 'Prosjekt', 'SiteTitle'),
    title: column(2, 'Tittel', 'Title'),
    phase: column(3, 'Fase', 'GtProjectPhase', { GtIsGroupable: true }),
    budget: column(4, 'Budsjett', 'GtBudgetTotal', { GtFieldDataType: 'Number' })
  }
}

/** A data source (view) showing the columns `columnIds` names, in that order. */
const view = (
  Id: number,
  Title: string,
  columnIds: number[] = [],
  columns: ProjectContentColumn[] = [],
  extra: Record<string, any> = {}
) =>
  new DataSource(
    {
      Id,
      Title,
      GtDataSourceLevel: ['Portefølje'],
      GtProjectContentColumnsId: columnIds,
      ...extra
    },
    columns
  )

/** Three views, the second one the default. */
const views = () => [
  view(1, 'Alle prosjekter'),
  view(2, 'Mine prosjekter', [], [], { GtDataSourceDefault: true }),
  view(3, 'Leveranser')
]

function setup(props: Partial<IPortfolioAggregationProps> = {}, state: Record<string, any> = {}) {
  const onUpdateProperty = jest.fn()
  const allProps = { onUpdateProperty, ...props } as IPortfolioAggregationProps
  const initialState = getInitialState(allProps)
  const reducer = createPortfolioAggregationReducer(allProps, initialState)
  return { reducer, onUpdateProperty, state: { ...initialState, ...state } as any }
}

const keys = (columns: ProjectContentColumn[]) => columns.map((c) => c.key)
const selected = (columns: ProjectContentColumn[]) => columns.map((c) => !!c.data?.isSelected)
const field = (state: any, name: string) => state.items.map((i: any) => i[name])
const currentViewTitle = (props: Partial<IPortfolioAggregationProps>) => {
  const { reducer, state } = setup(props, { views: views() })
  return reducer(state, SET_CURRENT_VIEW()).currentView?.title
}

describe('PortfolioAggregation reducer', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it("starts loading with the web part's columns and the configured views, panels closed", () => {
    const { title } = categoryColumns()
    const configured = view(1, 'Alle prosjekter')
    const { reducer, state } = setup({
      columns: [title],
      configuration: { views: [configured], level: 'Portefølje' } as any
    })
    expect(reducer(undefined, { type: 'UNKNOWN' })).toEqual(state)
    expect(state.loading).toBe(true)
    expect(state.columns).toEqual([title])
    expect(state.views).toEqual([configured])
    expect(state.dataSource).toBe('Alle prosjekter')
    expect(state.dataSourceLevel).toBe('Portefølje')
    expect(state.columnForm.isOpen).toBe(false)
    expect(state.viewForm.isOpen).toBe(false)
    expect(state.isEditViewColumnsPanelOpen).toBe(false)
  })

  describe('DATA_FETCHED', () => {
    it('shows the fetched rows in project name order, after the web part has transformed them', () => {
      const postTransform = (items: any[]) =>
        items.map((i) => ({ ...i, Title: i.Title.toUpperCase() }))
      const { reducer, state } = setup({ postTransform })
      const next = reducer(
        state,
        DATA_FETCHED({
          items: [
            { SiteTitle: 'Bravo', Title: 'b' },
            { SiteTitle: 'Alfa', Title: 'a' },
            { SiteTitle: 'Charlie', Title: 'c' }
          ]
        })
      )
      expect(next.items).toEqual([
        { SiteTitle: 'Alfa', Title: 'A' },
        { SiteTitle: 'Bravo', Title: 'B' },
        { SiteTitle: 'Charlie', Title: 'C' }
      ])
    })

    it("keeps the sort column's order, reversed when the column is marked descending", () => {
      const items = [
        { SiteTitle: 'Alfa', Title: 'B' },
        { SiteTitle: 'Bravo', Title: 'C' },
        { SiteTitle: 'Charlie', Title: 'A' }
      ]
      const ascending = setup({}, { sortBy: { fieldName: 'Title' } })
      expect(field(ascending.reducer(ascending.state, DATA_FETCHED({ items })), 'Title')).toEqual([
        'A',
        'B',
        'C'
      ])
      const descending = setup({}, { sortBy: { fieldName: 'Title', isSortedDescending: true } })
      expect(field(descending.reducer(descending.state, DATA_FETCHED({ items })), 'Title')).toEqual(
        ['C', 'B', 'A']
      )
    })

    it('shows only the rows of the projects the data source covers', () => {
      const { reducer, state } = setup()
      const next = reducer(
        state,
        DATA_FETCHED({
          items: [
            { SiteTitle: 'Alfa', SiteId: 's1' },
            { SiteTitle: 'Bravo', SiteId: 's2' }
          ],
          projects: [{ GtSiteId: 's2' }]
        })
      )
      expect(field(next, 'SiteTitle')).toEqual(['Bravo'])
    })

    it('without columns it takes the views and empties the columns, but keeps loading and the earlier error', () => {
      const { title } = categoryColumns()
      const earlier = new Error('Forrige feil')
      const { reducer, state } = setup(
        {},
        { error: earlier, columns: [title], allColumnsForCategory: [title] }
      )
      const next = reducer(
        state,
        DATA_FETCHED({
          items: [{ SiteTitle: 'Alfa' }],
          dataSources: [view(1, 'Alle prosjekter'), view(2, 'Mine prosjekter')]
        })
      )
      expect(field(next, 'SiteTitle')).toEqual(['Alfa'])
      expect(next.views.map((v) => v.title)).toEqual(['Alle prosjekter', 'Mine prosjekter'])
      expect(next.columns).toEqual([])
      expect(next.allColumnsForCategory).toEqual([])
      expect(next.loading).toBe(true)
      expect(next.error).toBe(earlier)
    })

    it("shows the view's columns in its column order, marked selected among all the category's columns", () => {
      const { siteTitle, title, phase, budget } = categoryColumns()
      const all = [siteTitle, title, phase, budget]
      const { reducer, state } = setup(
        {},
        { isChangingView: true, error: new Error('Forrige feil') }
      )
      const next = reducer(
        state,
        DATA_FETCHED({ items: [], columns: all, dataSource: view(1, 'Alle', [3, 2], all) })
      )
      expect(keys(next.columns)).toEqual(['GtProjectPhase', 'Title'])
      expect(keys(next.allColumnsForCategory)).toEqual([
        'SiteTitle',
        'Title',
        'GtProjectPhase',
        'GtBudgetTotal'
      ])
      expect(selected(next.allColumnsForCategory)).toEqual([false, true, true, false])
      expect(next.loading).toBe(false)
      expect(next.error).toBeNull()
      expect(next.isChangingView).toBe(false)
    })

    it("without view columns it shows the web part's saved columns, under their saved names", () => {
      const { title, phase, budget } = categoryColumns()
      const { reducer, state } = setup({
        columns: [
          { key: 'GtBudgetTotal', name: 'Budsjett (kr)', data: { isSelected: true } },
          { key: 'GtSlettet', name: 'Slettet kolonne', data: { isSelected: true } }
        ] as any
      })
      const next = reducer(
        state,
        DATA_FETCHED({ items: [], columns: [title, phase, budget], dataSource: view(1, 'Alle') })
      )
      expect(keys(next.columns)).toEqual(['GtBudgetTotal'])
      expect(next.columns[0].name).toBe('Budsjett (kr)')
      expect(next.columns[0].dataType).toBe('number')
      expect(selected(next.allColumnsForCategory)).toEqual([false, false, true])
    })

    it('without view or saved columns it shows every column of the category in sort order, none marked selected', () => {
      const title = column(2, 'Tittel', 'Title', { GtSortOrder: 30 })
      const phase = column(3, 'Fase', 'GtProjectPhase', { GtSortOrder: 10 })
      const budget = column(4, 'Budsjett', 'GtBudgetTotal', { GtSortOrder: 20 })
      const { reducer, state } = setup()
      const next = reducer(
        state,
        DATA_FETCHED({ items: [], columns: [title, phase, budget], dataSource: view(1, 'Alle') })
      )
      expect(keys(next.columns)).toEqual(['GtProjectPhase', 'GtBudgetTotal', 'Title'])
      expect(keys(next.allColumnsForCategory)).toEqual(['GtProjectPhase', 'GtBudgetTotal', 'Title'])
      expect(selected(next.allColumnsForCategory)).toEqual([false, false, false])
    })

    it('makes content columns of plain ones and counts a locked column as selected', () => {
      const plain = [
        {
          key: 'Title',
          fieldName: 'Title',
          name: 'Tittel',
          sortOrder: 10,
          data: { isLocked: true }
        },
        {
          key: 'GtProjectPhase',
          fieldName: 'GtProjectPhase',
          name: 'Fase',
          sortOrder: 20,
          data: {}
        }
      ] as any[]
      const { reducer, state } = setup()
      const next = reducer(
        state,
        DATA_FETCHED({ items: [], columns: plain, dataSource: view(1, 'Alle') })
      )
      expect(next.allColumnsForCategory.every((c) => c instanceof ProjectContentColumn)).toBe(true)
      expect(selected(next.allColumnsForCategory)).toEqual([true, false])
    })

    it("takes the view and the columns from the web part's configuration over the fetched ones", () => {
      const { title, phase, budget } = categoryColumns()
      const { reducer, state } = setup({
        configuration: {
          columns: [title, phase, budget],
          views: [view(1, 'Alle prosjekter', [4, 2], [title, phase, budget])]
        } as any
      })
      const next = reducer(
        state,
        DATA_FETCHED({
          items: [],
          columns: [title],
          dataSource: view(1, 'Alle prosjekter', [2], [title])
        })
      )
      expect(keys(next.columns)).toEqual(['GtBudgetTotal', 'Title'])
      expect(keys(next.allColumnsForCategory)).toEqual(['Title', 'GtProjectPhase', 'GtBudgetTotal'])
    })

    it('leaves the project name column out of a project-level data source', () => {
      const { siteTitle, title } = categoryColumns()
      const dataSource = view(1, 'Alle leveranser', [1, 2], [siteTitle, title], {
        GtDataSourceLevel: [resource.Lists_DataSources_Level_Project]
      })
      const { reducer, state } = setup()
      const next = reducer(
        state,
        DATA_FETCHED({ items: [], columns: [siteTitle, title], dataSource })
      )
      expect(keys(next.columns)).toEqual(['Title'])
      expect(keys(next.allColumnsForCategory)).toEqual(['Title'])
    })

    it('renders a text taxonomy column as tags', () => {
      const area = column(5, 'Tjenesteområde', 'owstaxIdGtProjectServiceArea')
      const note = column(6, 'Merknad', 'GtNoteOWSTAXID', { GtFieldDataType: 'Note' })
      const { reducer, state } = setup()
      const next = reducer(
        state,
        DATA_FETCHED({ items: [], columns: [area, note], dataSource: view(1, 'Alle') })
      )
      expect(next.allColumnsForCategory.map((c) => c.dataType)).toEqual(['tags', 'note'])
    })

    it('throws when columns arrive without a data source', () => {
      const { title } = categoryColumns()
      const { reducer, state } = setup()
      expect(() => reducer(state, DATA_FETCHED({ items: [], columns: [title] }))).toThrow(TypeError)
    })
  })

  it('keeps the fetch error and ends the loading and the change of view', () => {
    const { reducer, state } = setup({}, { isChangingView: true })
    const error = new Error('Kilden svarte ikke')
    const next = reducer(state, DATA_FETCH_ERROR({ error }))
    expect(next.error).toBe(error)
    expect(next.loading).toBe(false)
    expect(next.isChangingView).toBe(false)
  })

  it('starts loading and keeps the search term as typed', () => {
    const { reducer, state } = setup({}, { loading: false })
    expect(reducer(state, START_FETCH()).loading).toBe(true)
    expect(reducer(state, EXECUTE_SEARCH('Konsept')).searchTerm).toBe('Konsept')
  })

  it('toggles the filter panel, and sets compact mode to what the payload says', () => {
    const { reducer, state } = setup()
    const open = reducer(state, TOGGLE_FILTER_PANEL())
    expect(open.isFilterPanelOpen).toBe(true)
    expect(reducer(open, TOGGLE_FILTER_PANEL()).isFilterPanelOpen).toBe(false)
    const compact = reducer(state, TOGGLE_COMPACT(true))
    expect(compact.isCompact).toBe(true)
    // Choosing the mode already on keeps it.
    expect(reducer(compact, TOGGLE_COMPACT(true)).isCompact).toBe(true)
    expect(reducer(compact, TOGGLE_COMPACT(false)).isCompact).toBe(false)
    expect(reducer(state, TOGGLE_COMPACT(false)).isCompact).toBe(false)
    // Without a payload it flips.
    expect(reducer(compact, TOGGLE_COMPACT()).isCompact).toBe(false)
  })

  it('keeps the selected rows', () => {
    const { reducer, state } = setup()
    expect(reducer(state, SELECTION_CHANGED([{ Title: 'Alfa' }])).selectedItems).toEqual([
      { Title: 'Alfa' }
    ])
  })

  it('opens the column menu at its header and closes it', () => {
    const { phase } = categoryColumns()
    const { reducer, state } = setup()
    const target = document.createElement('div')
    const open = reducer(state, TOGGLE_COLUMN_CONTEXT_MENU({ column: phase, target }))
    expect(open.columnContextMenu.column).toBe(phase)
    expect(open.columnContextMenu.target).toBe(target)
    expect(reducer(open, TOGGLE_COLUMN_CONTEXT_MENU(null)).columnContextMenu).toBeNull()
  })

  describe('column form and show/hide panel', () => {
    it('opens the column form for a new column or the chosen one, and closes it', () => {
      const { phase } = categoryColumns()
      const { reducer, state } = setup()
      expect(reducer(state, TOGGLE_COLUMN_FORM_PANEL({ isOpen: true })).columnForm).toEqual({
        isOpen: true
      })
      const editing = reducer(state, TOGGLE_COLUMN_FORM_PANEL({ isOpen: true, column: phase }))
      expect(editing.columnForm.isOpen).toBe(true)
      expect(editing.columnForm.column).toBe(phase)
      expect(reducer(editing, TOGGLE_COLUMN_FORM_PANEL({ isOpen: false })).columnForm).toEqual({
        isOpen: false
      })
    })

    it('adds a new column last and selected, closes the form and saves the columns in the web part', () => {
      const { title, phase } = categoryColumns()
      title.setData({ isSelected: true })
      phase.setData({ isSelected: true })
      const { reducer, state, onUpdateProperty } = setup(
        {},
        {
          columns: [title, phase],
          allColumnsForCategory: [title, phase],
          columnForm: { isOpen: true }
        }
      )
      const before = Date.now()
      const next = reducer(
        state,
        COLUMN_FORM_PANEL_ON_SAVED({ column: column(7, 'Risiko', 'GtRiskOWSTEXT'), isNew: true })
      )
      expect(keys(next.columns)).toEqual(['Title', 'GtProjectPhase', 'GtRiskOWSTEXT'])
      expect(keys(next.allColumnsForCategory)).toEqual(['Title', 'GtProjectPhase', 'GtRiskOWSTEXT'])
      expect(selected(next.allColumnsForCategory)).toEqual([true, true, true])
      expect(next.columnForm).toEqual({ isOpen: false })
      expect(next.columnAddedOrUpdated).toBeGreaterThanOrEqual(before)
      expect(next.columnAddedOrUpdated).toBeLessThanOrEqual(Date.now())
      expect(onUpdateProperty).toHaveBeenCalledTimes(1)
      expect(onUpdateProperty.mock.calls[0][0]).toBe('columns')
      expect(keys(onUpdateProperty.mock.calls[0][1])).toEqual([
        'Title',
        'GtProjectPhase',
        'GtRiskOWSTEXT'
      ])
    })

    it('replaces an edited column, found by field name, in the list and the category', () => {
      const { title, phase, budget } = categoryColumns()
      title.setData({ isSelected: true })
      phase.setData({ isSelected: true })
      const { reducer, state, onUpdateProperty } = setup(
        {},
        { columns: [title, phase], allColumnsForCategory: [title, phase, budget] }
      )
      const next = reducer(
        state,
        COLUMN_FORM_PANEL_ON_SAVED({
          column: column(3, 'Prosjektfase', 'GtProjectPhase'),
          isNew: false
        })
      )
      expect(next.columns.map((c) => c.name)).toEqual(['Tittel', 'Prosjektfase'])
      expect(next.allColumnsForCategory.map((c) => c.name)).toEqual([
        'Tittel',
        'Prosjektfase',
        'Budsjett'
      ])
      expect(selected(next.allColumnsForCategory)).toEqual([true, true, false])
      expect(next.columnForm).toEqual({ isOpen: false })
      expect(onUpdateProperty.mock.calls[0][1].map((c: any) => c.name)).toEqual([
        'Tittel',
        'Prosjektfase'
      ])
    })

    it('removes a deleted column from the list, the category and the web part', () => {
      const { title, phase, budget } = categoryColumns()
      title.setData({ isSelected: true })
      phase.setData({ isSelected: true })
      const { reducer, state, onUpdateProperty } = setup(
        {},
        {
          columns: [title, phase],
          allColumnsForCategory: [title, phase, budget],
          columnForm: { isOpen: true, column: phase }
        }
      )
      const before = Date.now()
      const next = reducer(state, COLUMN_DELETED({ columnId: 3 }))
      expect(keys(next.columns)).toEqual(['Title'])
      // The show/hide panel offers the category's columns: the deleted one is gone there too.
      expect(keys(next.allColumnsForCategory)).toEqual(['Title', 'GtBudgetTotal'])
      expect(next.columnForm).toEqual({ isOpen: false })
      expect(next.columnDeleted).toBeGreaterThanOrEqual(before)
      expect(next.columnDeleted).toBeLessThanOrEqual(Date.now())
      expect(keys(onUpdateProperty.mock.calls[0][1])).toEqual(['Title'])
    })

    it('opens and closes the show/hide panel without touching the columns', () => {
      const { title } = categoryColumns()
      const { reducer, state, onUpdateProperty } = setup({}, { columns: [title] })
      const open = reducer(state, TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: true }))
      expect(open.isEditViewColumnsPanelOpen).toBe(true)
      expect(open.columns).toEqual([title])
      expect(
        reducer(open, TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: false })).isEditViewColumnsPanelOpen
      ).toBe(false)
      expect(onUpdateProperty).not.toHaveBeenCalled()
    })

    it('shows the chosen columns, marks them in the category, stores them on the view and saves them in the web part', () => {
      const { siteTitle, title, phase, budget } = categoryColumns()
      siteTitle.setData({ isLocked: true })
      const current = view(1, 'Alle prosjekter', [2, 3], [title, phase])
      const other = view(2, 'Mine prosjekter', [2], [title])
      const { reducer, state, onUpdateProperty } = setup(
        {},
        {
          isEditViewColumnsPanelOpen: true,
          columns: [title, phase],
          allColumnsForCategory: [siteTitle, title, phase, budget],
          currentView: current,
          views: [other, current]
        }
      )
      const chosen = [budget.setData({ isSelected: true }), title.setData({ isSelected: true })]
      const next = reducer(
        state,
        TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: false, columns: chosen })
      )
      expect(next.isEditViewColumnsPanelOpen).toBe(false)
      expect(keys(next.columns)).toEqual(['GtBudgetTotal', 'Title'])
      expect(next.allColumnsForCategory.every((c) => c instanceof ProjectContentColumn)).toBe(true)
      expect(selected(next.allColumnsForCategory)).toEqual([true, true, false, true])
      expect(keys(next.currentView.columns)).toEqual(['GtBudgetTotal', 'Title'])
      expect(next.currentView.columnIds).toEqual([4, 2])
      expect(next.views[1].columnIds).toEqual([4, 2])
      expect(next.views[0].columnIds).toEqual([2])
      const [property, persisted] = onUpdateProperty.mock.calls[0]
      expect(property).toBe('columns')
      expect(keys(persisted)).toEqual(['GtBudgetTotal', 'Title'])
      expect(Object.keys(persisted[0])).toEqual([
        'id',
        'sortOrder',
        'key',
        'fieldName',
        'internalName',
        'name',
        'minWidth',
        'maxWidth',
        'data'
      ])
    })

    it('without a current view, or one missing from the views, only the list and the category change', () => {
      const { title, phase } = categoryColumns()
      const others = [view(2, 'Mine prosjekter', [2], [title])]
      const chosen = [phase.setData({ isSelected: true })]
      const noView = setup({}, { views: others, allColumnsForCategory: [title, phase] })
      const withoutView = noView.reducer(
        noView.state,
        TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: false, columns: chosen })
      )
      expect(keys(withoutView.columns)).toEqual(['GtProjectPhase'])
      expect(withoutView.currentView).toBeUndefined()
      const missing = setup(
        {},
        { views: others, currentView: view(9, 'Slettet'), allColumnsForCategory: [title, phase] }
      )
      const withMissing = missing.reducer(
        missing.state,
        TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: false, columns: chosen })
      )
      expect(withMissing.currentView.columnIds).toEqual([3])
      expect(withMissing.views[0].columnIds).toEqual([2])
    })
  })

  describe('grouping and sorting', () => {
    const rows = () => [
      { SiteTitle: 'Bravo', Title: 'B', GtProjectPhase: 'Realisere' },
      { SiteTitle: 'Alfa', Title: 'C', GtProjectPhase: 'Konsept' },
      { SiteTitle: 'Charlie', Title: 'A', GtProjectPhase: 'Konsept' }
    ]

    it('groups by a column with its rows in runs, and ungroups back in project name order when chosen again', () => {
      const { phase, title } = categoryColumns()
      const { reducer, state } = setup({}, { items: rows() })
      const grouped = reducer(state, SET_GROUP_BY({ column: phase }))
      expect(grouped.groupBy).toBe(phase)
      expect(field(grouped, 'SiteTitle')).toEqual(['Alfa', 'Charlie', 'Bravo'])
      const regrouped = reducer(grouped, SET_GROUP_BY({ column: title }))
      expect(regrouped.groupBy).toBe(title)
      expect(field(regrouped, 'Title')).toEqual(['A', 'B', 'C'])
      const ungrouped = reducer(grouped, SET_GROUP_BY({ column: phase }))
      expect(ungrouped.groupBy).toBeNull()
      expect(field(ungrouped, 'SiteTitle')).toEqual(['Alfa', 'Bravo', 'Charlie'])
    })

    it('ungrouping, or a view without a group column, sorts by the sort column, reversed when it is marked descending', () => {
      const { phase } = categoryColumns()
      const { reducer, state } = setup(
        {},
        { items: rows(), groupBy: phase, sortBy: { fieldName: 'Title', isSortedDescending: true } }
      )
      const ungrouped = reducer(state, SET_GROUP_BY({ column: phase }))
      expect(ungrouped.groupBy).toBeNull()
      expect(field(ungrouped, 'Title')).toEqual(['C', 'B', 'A'])
      const noGroupColumn = setup({}, { items: rows() })
      const next = noGroupColumn.reducer(noGroupColumn.state, SET_GROUP_BY({ column: undefined }))
      expect(next.groupBy).toBeNull()
      expect(field(next, 'SiteTitle')).toEqual(['Alfa', 'Bravo', 'Charlie'])
    })

    it("after a fetch groups by the view's group column, also when already grouped by it, and ungroups without one", () => {
      const { phase } = categoryColumns()
      const { reducer, state } = setup(
        {},
        { items: rows(), sortBy: { fieldName: 'Title', isSortedDescending: true } }
      )
      const grouped = reducer(state, SET_VIEW_GROUP_BY({ column: phase }))
      expect(grouped.groupBy).toBe(phase)
      expect(field(grouped, 'SiteTitle')).toEqual(['Alfa', 'Charlie', 'Bravo'])
      // The fetch of a view grouped by the column the rows are grouped by keeps the grouping.
      expect(reducer(grouped, SET_VIEW_GROUP_BY({ column: phase })).groupBy).toBe(phase)
      const ungrouped = reducer(grouped, SET_VIEW_GROUP_BY({ column: undefined }))
      expect(ungrouped.groupBy).toBeNull()
      expect(field(ungrouped, 'Title')).toEqual(['C', 'B', 'A'])
    })

    it('keeps the chosen sort direction through ungrouping and a refetch', () => {
      const { title, phase } = categoryColumns()
      const { reducer, state } = setup({}, { items: rows(), columns: [title, phase] })
      const keepsOrder = (isSortedDescending: boolean, order: string[]) => {
        const sorted = reducer(state, SET_SORT({ column: title, isSortedDescending }))
        expect(field(sorted, 'Title')).toEqual(order)
        const grouped = reducer(sorted, SET_GROUP_BY({ column: phase }))
        const ungrouped = reducer(grouped, SET_GROUP_BY({ column: phase }))
        expect(field(ungrouped, 'Title')).toEqual(order)
        const refetched = reducer(sorted, DATA_FETCHED({ items: rows() }))
        expect(field(refetched, 'Title')).toEqual(order)
      }
      // "A til Å" in the column menu sends `isSortedDescending: false`, "Å til A" sends `true`.
      keepsOrder(false, ['A', 'B', 'C'])
      keepsOrder(true, ['C', 'B', 'A'])
    })

    it('sorts text rows both ways, ignoring case, and marks the sorted column', () => {
      const { title, phase } = categoryColumns()
      const { reducer, state } = setup(
        {},
        {
          items: [{ Title: 'Bravo' }, { Title: 'alfa' }, { Title: 'Charlie' }],
          columns: [title, phase]
        }
      )
      const ascending = reducer(state, SET_SORT({ column: title, isSortedDescending: false }))
      expect(field(ascending, 'Title')).toEqual(['alfa', 'Bravo', 'Charlie'])
      expect(ascending.sortBy).toBe(title)
      // The list header shows the direction from `isSortedDescending`.
      expect(ascending.columns.map((c) => [c.isSorted, c.isSortedDescending])).toEqual([
        [true, false],
        [false, false]
      ])
      const descending = reducer(state, SET_SORT({ column: title, isSortedDescending: true }))
      expect(field(descending, 'Title')).toEqual(['Charlie', 'Bravo', 'alfa'])
      expect(descending.columns.map((c) => [c.isSorted, c.isSortedDescending])).toEqual([
        [true, true],
        [false, false]
      ])
    })

    it('sorts within the groups when grouped, keeping the grouping and the groups in order, as the portfolio overview does', () => {
      const { title, phase, budget } = categoryColumns()
      const { reducer, state } = setup(
        {},
        {
          // Search returns numbers as text.
          items: [
            { Title: 'B', GtProjectPhase: 'Realisere', GtBudgetTotal: '50' },
            { Title: 'C', GtProjectPhase: 'Konsept', GtBudgetTotal: '4' },
            { Title: 'A', GtProjectPhase: 'Konsept', GtBudgetTotal: '30' },
            { Title: 'D', GtProjectPhase: 'Realisere', GtBudgetTotal: '7' }
          ],
          columns: [title, phase, budget]
        }
      )
      const rowsOf = (s: any) => s.items.map((i: any) => `${i.GtProjectPhase}:${i.Title}`)
      const grouped = reducer(state, SET_GROUP_BY({ column: phase }))
      const descending = reducer(grouped, SET_SORT({ column: title, isSortedDescending: true }))
      expect(descending.groupBy).toBe(phase)
      expect(rowsOf(descending)).toEqual(['Konsept:C', 'Konsept:A', 'Realisere:D', 'Realisere:B'])
      expect(descending.columns.map((c) => [c.isSorted, c.isSortedDescending])).toEqual([
        [true, true],
        [false, false],
        [false, false]
      ])
      // Ungrouping afterwards keeps the sort. Asserted before the next sort, which marks the
      // same column objects (the reducer sets `isSorted` on them in place, as the list reads it).
      const ungrouped = reducer(descending, SET_GROUP_BY({ column: phase }))
      expect(ungrouped.groupBy).toBeNull()
      expect(field(ungrouped, 'Title')).toEqual(['D', 'C', 'B', 'A'])
      const ascending = reducer(descending, SET_SORT({ column: title, isSortedDescending: false }))
      expect(ascending.groupBy).toBe(phase)
      expect(rowsOf(ascending)).toEqual(['Konsept:A', 'Konsept:C', 'Realisere:B', 'Realisere:D'])
      // A number column sorts by its numbers within each group, not as text.
      const byBudget = reducer(grouped, SET_SORT({ column: budget, isSortedDescending: false }))
      expect(rowsOf(byBudget)).toEqual(['Konsept:C', 'Konsept:A', 'Realisere:D', 'Realisere:B'])
      // And so does ungrouping, which sorts all rows by it again.
      const ungroupedByBudget = reducer(byBudget, SET_GROUP_BY({ column: phase }))
      expect(field(ungroupedByBudget, 'Title')).toEqual(['C', 'D', 'A', 'B'])
    })

    it('sorts number, currency and percentage rows by their numbers', () => {
      const budget = column(4, 'Budsjett', 'GtBudgetTotal', { GtFieldDataType: 'Number' })
      const costs = column(5, 'Kostnader', 'GtCostsTotal', { GtFieldDataType: 'Currency' })
      const progress = column(6, 'Fremdrift', 'GtProgress', { GtFieldDataType: 'Percentage' })
      const { reducer, state } = setup(
        {},
        {
          items: [
            { Title: 'Ti', GtBudgetTotal: 10, GtCostsTotal: 'kr 1000', GtProgress: '5%' },
            { Title: 'To', GtBudgetTotal: 2, GtCostsTotal: 'kr 30', GtProgress: '100%' },
            { Title: 'Hundre', GtBudgetTotal: 100, GtCostsTotal: 'kr 200', GtProgress: '50%' }
          ],
          columns: [budget, costs, progress]
        }
      )
      const sortBy = (c: ProjectContentColumn, isSortedDescending: boolean) =>
        field(reducer(state, SET_SORT({ column: c, isSortedDescending })), 'Title')
      expect(sortBy(budget, false)).toEqual(['To', 'Ti', 'Hundre'])
      expect(sortBy(budget, true)).toEqual(['Hundre', 'Ti', 'To'])
      expect(sortBy(costs, false)).toEqual(['To', 'Hundre', 'Ti'])
      expect(sortBy(costs, true)).toEqual(['Ti', 'Hundre', 'To'])
      expect(sortBy(progress, false)).toEqual(['Ti', 'Hundre', 'To'])
      expect(sortBy(progress, true)).toEqual(['To', 'Hundre', 'Ti'])
    })

    it("without a direction it flips the column's current one", () => {
      const { title } = categoryColumns()
      const { reducer, state } = setup(
        {},
        { items: [{ Title: 'Bravo' }, { Title: 'Alfa' }, { Title: 'Charlie' }], columns: [title] }
      )
      const first = reducer(state, SET_SORT({ column: title } as any))
      expect(field(first, 'Title')).toEqual(['Charlie', 'Bravo', 'Alfa'])
      expect(first.columns[0].isSortedDescending).toBe(true)
      const second = reducer(first, SET_SORT({ column: first.columns[0] } as any))
      expect(field(second, 'Title')).toEqual(['Alfa', 'Bravo', 'Charlie'])
      expect(second.columns[0].isSortedDescending).toBe(false)
    })
  })

  describe('current view', () => {
    it('opens the default view, writes it with the grouping to the address and clears the filters', () => {
      const { phase } = categoryColumns()
      const { reducer, state } = setup(
        {},
        { views: views(), groupBy: phase, activeFilters: { GtProjectPhase: ['Konsept'] } }
      )
      const next = reducer(state, SET_CURRENT_VIEW())
      expect(next.currentView.title).toBe('Mine prosjekter')
      expect(next.activeFilters).toEqual({})
      expect(document.location.hash).toBe('#viewId=2&groupBy=GtProjectPhase')
    })

    it('the default view id wins over the view named in the web part, which wins over the default view', () => {
      expect(currentViewTitle({ dataSource: 'Leveranser' })).toBe('Leveranser')
      // The view just opened is in the address now, and the address wins over the properties.
      expect(currentViewTitle({ dataSource: 'Leveranser', defaultViewId: '1' })).toBe('Leveranser')
      window.history.replaceState(null, '', '/')
      expect(currentViewTitle({ dataSource: 'Leveranser', defaultViewId: '1' })).toBe(
        'Alle prosjekter'
      )
    })

    it('a view id in the address hash wins over the web part properties', () => {
      document.location.hash = '#viewId=3'
      expect(currentViewTitle({ dataSource: 'Mine prosjekter', defaultViewId: '1' })).toBe(
        'Leveranser'
      )
      expect(document.location.hash).toBe('#viewId=3')
    })

    it('a viewId query parameter wins over the hash, wherever it stands in the query', () => {
      window.history.replaceState(null, '', '/?viewId=1#viewId=3')
      expect(currentViewTitle({})).toBe('Alle prosjekter')
      window.history.replaceState(null, '', '/?visning=liste&viewId=1')
      expect(currentViewTitle({ defaultViewId: '3' })).toBe('Alle prosjekter')
      // The hash after the query is not part of the parameter's value.
      window.history.replaceState(null, '', '/?visning=liste&viewId=3#groupBy=GtProjectPhase')
      expect(currentViewTitle({ defaultViewId: '1' })).toBe('Leveranser')
    })

    it('falls back to the first view when the named one cannot be found', () => {
      expect(currentViewTitle({ dataSource: 'Finnes ikke' })).toBe('Alle prosjekter')
      document.location.hash = '#viewId=9'
      expect(currentViewTitle({})).toBe('Alle prosjekter')
    })

    it('with no views at all it opens none and says which view it could not find', () => {
      const errorFor = (props: Partial<IPortfolioAggregationProps>) => {
        const { reducer, state } = setup(props)
        const next = reducer(state, SET_CURRENT_VIEW())
        expect(next.currentView).toBeUndefined()
        // `PortfolioAggregationErrorMessage` compiled to ES5 yields a plain `Error` carrying `type`.
        expect(next.error).toBeInstanceOf(Error)
        expect((next.error as any).type).toBe('error')
        return next.error.message
      }
      expect(errorFor({})).toBe(strings.ViewNotFoundMessage)
      expect(document.location.hash).toBe('')
      expect(errorFor({ dataSource: 'Finnes ikke' })).toBe(
        format(strings.ViewNotFoundMessage_WebPartProperty, 'Finnes ikke')
      )
      document.location.hash = '#viewId=9'
      expect(errorFor({})).toBe(format(strings.ViewNotFoundMessage_Id, '9'))
      window.history.replaceState(null, '', '/?visning=liste&viewId=8')
      expect(errorFor({})).toBe(format(strings.ViewNotFoundMessage_Id, '8'))
    })

    it('reacts to the action creator itself, which is what the web part dispatches', () => {
      const { reducer, state } = setup({}, { views: views() })
      expect(reducer(state, SET_CURRENT_VIEW as any).currentView.title).toBe('Mine prosjekter')
    })

    it('switching view writes it to the address, clears the filters and marks the view as changing', () => {
      const { phase } = categoryColumns()
      const [first, second] = views()
      const { reducer, state } = setup(
        {},
        { currentView: first, groupBy: phase, activeFilters: { GtProjectPhase: ['Konsept'] } }
      )
      const next = reducer(state, SET_DATA_SOURCE({ dataSource: second }))
      expect(next.currentView).toBe(second)
      expect(next.isChangingView).toBe(true)
      expect(next.activeFilters).toEqual({})
      expect(document.location.hash).toBe('#viewId=2&groupBy=GtProjectPhase')
    })

    it('choosing the current view again changes nothing', () => {
      const [first] = views()
      const { reducer, state } = setup({}, { currentView: first })
      expect(reducer(state, SET_DATA_SOURCE({ dataSource: view(1, 'Alle prosjekter') }))).toBe(
        state
      )
      expect(document.location.hash).toBe('')
    })

    it('switching from no view leaves the view out of the address', () => {
      const [first] = views()
      const { reducer, state } = setup()
      const next = reducer(state, SET_DATA_SOURCE({ dataSource: first }))
      expect(next.currentView).toBe(first)
      expect(document.location.hash).toBe('')
    })
  })

  describe('view form', () => {
    it('opens the view form for a new view or the current one, without a submit action', () => {
      const [first] = views()
      const { reducer, state } = setup()
      expect(reducer(state, SET_VIEW_FORM_PANEL({ isOpen: true })).viewForm).toEqual({
        isOpen: true
      })
      const editing = reducer(state, SET_VIEW_FORM_PANEL({ isOpen: true, view: first }))
      expect(editing.viewForm.view).toBe(first)
      const closed = reducer(
        editing,
        SET_VIEW_FORM_PANEL({ isOpen: false, submitAction: undefined })
      )
      expect(Object.keys(closed.viewForm)).toEqual(['isOpen'])
      expect(closed.viewForm.isOpen).toBe(false)
    })

    it('a new view is added, becomes current, goes in the address and closes the form', () => {
      const { phase } = categoryColumns()
      const [first, , third] = views()
      const { reducer, state } = setup(
        {},
        { currentView: first, views: [first], groupBy: phase, viewForm: { isOpen: true } }
      )
      const next = reducer(
        state,
        SET_VIEW_FORM_PANEL({ isOpen: false, view: third, submitAction: 'add' })
      )
      expect(next.currentView).toBe(third)
      expect(next.views.map((v) => v.title)).toEqual(['Alle prosjekter', 'Leveranser'])
      expect(next.viewForm).toEqual({ isOpen: false })
      expect(document.location.hash).toBe('#viewId=3&groupBy=GtProjectPhase')
    })

    it('an edited view replaces its old version and stays current', () => {
      const [first, second] = views()
      const edited = view(2, 'Mine aktive prosjekter')
      const { reducer, state } = setup(
        {},
        { currentView: second, views: [first, second], viewForm: { isOpen: true, view: second } }
      )
      const next = reducer(
        state,
        SET_VIEW_FORM_PANEL({ isOpen: false, view: edited, submitAction: 'edit' })
      )
      expect(next.currentView).toBe(edited)
      expect(next.views.map((v) => v.title)).toEqual(['Alle prosjekter', 'Mine aktive prosjekter'])
      expect(next.viewForm).toEqual({ isOpen: false })
      expect(document.location.hash).toBe('')
    })
  })

  describe('filters', () => {
    const phase = {
      key: 'GtProjectPhase',
      fieldName: 'GtProjectPhase',
      internalName: 'GtProjectPhase',
      name: 'Fase'
    }
    const serviceArea = {
      key: 'GtProjectServiceAreaOWSTXT',
      fieldName: 'GtProjectServiceAreaOWSTXT',
      internalName: 'GtProjectServiceArea',
      name: 'Tjenesteområde'
    }
    const values = (filter: any) => filter.items.map((i: any) => i.value)

    it('offers each value of a column once, in value order, with its display name and unselected', () => {
      const { reducer, state } = setup(
        {},
        {
          items: [
            { GtProjectPhase: 'Planlegge;Konsept' },
            { GtProjectPhase: 'Konsept' },
            { GtProjectPhase: '' },
            {},
            { GtProjectPhase: 'Fase | Realisere' }
          ]
        }
      )
      const next = reducer(state, GET_FILTERS({ filters: [{ column: phase }] }))
      expect(next.filters).toEqual([
        {
          column: phase,
          items: [
            { name: 'Realisere', value: 'Fase | Realisere', selected: false },
            { name: 'Konsept', value: 'Konsept', selected: false },
            { name: 'Planlegge', value: 'Planlegge', selected: false }
          ],
          group: undefined,
          defaultCollapsed: undefined
        }
      ])
    })

    it("reads the projects' refiner values first, and keeps a filter's group and collapsed state", () => {
      const { reducer, state } = setup(
        {},
        {
          items: [
            {
              GtProjectServiceAreaOWSTXT: 'Fra søket',
              GtProjectPhase: 'Konsept',
              __projectRefinerValues: { GtProjectServiceArea: ['IT', null, 'HR'] }
            },
            {
              GtProjectPhase: 'Realisere',
              __projectRefinerValues: { GtProjectServiceArea: 'Økonomi;IT' }
            }
          ]
        }
      )
      const next = reducer(
        state,
        GET_FILTERS({
          filters: [
            { column: serviceArea, group: 'Prosjektinformasjon', defaultCollapsed: true },
            { column: phase },
            { column: { ...serviceArea, internalName: '' } }
          ]
        })
      )
      expect(values(next.filters[0])).toEqual(['HR', 'IT', 'Økonomi'])
      expect(next.filters[0].group).toBe('Prosjektinformasjon')
      expect(next.filters[0].defaultCollapsed).toBe(true)
      expect(values(next.filters[1])).toEqual(['Konsept', 'Realisere'])
      expect(values(next.filters[2])).toEqual(['Fra søket'])
    })

    it('names the program and parent project flags Ja and Nei', () => {
      const isProgram = { key: 'GtIsProgram', fieldName: 'GtIsProgramOWSBOOL', name: 'Program' }
      const isParent = {
        key: 'GtIsParent',
        fieldName: 'GtIsParentProjectOWSBOOL',
        name: 'Overordnet'
      }
      const other = { key: 'GtCount', fieldName: 'GtCountOWSNMBR', name: 'Antall' }
      const { reducer, state } = setup(
        {},
        {
          items: [
            { GtIsProgramOWSBOOL: '1', GtIsParentProjectOWSBOOL: '0', GtCountOWSNMBR: '1' },
            { GtIsProgramOWSBOOL: '0', GtIsParentProjectOWSBOOL: '1', GtCountOWSNMBR: '0' }
          ]
        }
      )
      const next = reducer(
        state,
        GET_FILTERS({ filters: [{ column: isProgram }, { column: isParent }, { column: other }] })
      )
      const names = (filter: any) => filter.items.map((i: any) => i.name)
      expect(names(next.filters[0])).toEqual([strings.BooleanNo, strings.BooleanYes])
      expect(names(next.filters[1])).toEqual([strings.BooleanNo, strings.BooleanYes])
      expect(names(next.filters[2])).toEqual(['0', '1'])
    })

    it('keeps the active filter values selected when the filters are rebuilt', () => {
      const { reducer, state } = setup(
        {},
        {
          items: [{ GtProjectPhase: 'Konsept' }, { GtProjectPhase: 'Planlegge' }],
          activeFilters: { GtProjectPhase: ['Konsept'], GtAnnet: ['X'] }
        }
      )
      const next = reducer(state, GET_FILTERS({ filters: [{ column: phase }] }))
      expect(next.filters[0].items.map((i: any) => [i.value, i.selected])).toEqual([
        ['Konsept', true],
        ['Planlegge', false]
      ])
    })

    it('filters on the selected values and checks them, and clearing them removes the filter', () => {
      const { reducer, state } = setup(
        {},
        {
          activeFilters: { GtProjectServiceAreaOWSTXT: ['IT'] },
          filters: [
            {
              column: phase,
              items: [
                { name: 'Konsept', value: 'Konsept', selected: false },
                { name: 'Planlegge', value: 'Planlegge', selected: false }
              ]
            },
            { column: serviceArea, items: [{ name: 'IT', value: 'IT', selected: true }] }
          ]
        }
      )
      const checked = (next: any) =>
        next.filters.map((f: any) => f.items.map((i: any) => i.selected))
      const filtered = reducer(
        state,
        ON_FILTER_CHANGE({
          column: phase as any,
          selectedItems: [{ name: 'Planlegge', value: 'Planlegge' }] as any
        })
      )
      expect(filtered.activeFilters).toEqual({
        GtProjectServiceAreaOWSTXT: ['IT'],
        GtProjectPhase: ['Planlegge']
      })
      expect(checked(filtered)).toEqual([[false, true], [true]])
      const cleared = reducer(
        filtered,
        ON_FILTER_CHANGE({ column: phase as any, selectedItems: [] })
      )
      expect(cleared.activeFilters).toEqual({ GtProjectServiceAreaOWSTXT: ['IT'] })
      expect(checked(cleared)).toEqual([[false, false], [true]])
    })
  })
})
