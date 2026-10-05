// The title column can open ProjectWebParts' project information panel; that panel is not under
// test here, and loading its solution's module graph is what the mock avoids. jest.mock must come
// before the imports: Heft runs Jest on CommonJS output without Babel, so mocks are not hoisted.
jest.mock('pp365-projectwebparts/lib/components/ProjectInformationPanel', () => ({
  ProjectInformationPanel: () => null
}))
jest.mock('pp365-projectwebparts/lib/components/ProjectInformation', () => ({
  ProjectInformationPanel: () => null
}))

import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'PortfolioWebPartsStrings'
import { ColumnRenderComponentRegistry, format, ListMenuItem } from 'pp365-shared-library'
import * as React from 'react'
import { HubColumn } from './ItemColumn/HubColumn'
import { List } from './List'
import { IListProps } from './types'

/**
 * The hub's list as the portfolio overview and the aggregated overview drive it: the header with
 * title, search box and toolbar above the column headers, one row per item with the cells rendered
 * through the column's own rules, hidden columns and the add column, the header click that opens
 * the column menu, groups that open and close, and the selection: by check, by shift-click range,
 * by group and all at once. Asserted through roles and text, so it holds whatever renders the
 * rows.
 */

type Column = Record<string, any>

function column(fieldName: string, name: string, extra: Column = {}): Column {
  return { key: fieldName, fieldName, name, minWidth: 100, dataType: 'text', ...extra }
}

const ITEMS = [
  { Title: 'Alfa', GtProjectPhase: 'Konsept' },
  { Title: 'Bravo', GtProjectPhase: 'Planlegge' },
  { Title: 'Charlie', GtProjectPhase: 'Planlegge' },
  { Title: 'Delta', GtProjectPhase: 'Gjennomføre' }
]

const GROUPS = [
  { key: 'g0', name: 'Fase: Konsept', startIndex: 0, count: 1 },
  { key: 'g1', name: 'Fase: Planlegge', startIndex: 1, count: 2 },
  { key: 'g2', name: 'Fase: Gjennomføre', startIndex: 3, count: 1 }
]

function renderList(props: Partial<IListProps<any>> = {}) {
  return render(
    <List
      items={[{ Title: 'Alfa', Path: '/sites/alfa', GtProjectPhase: 'Konsept' }]}
      columns={[column('Title', 'Tittel'), column('GtProjectPhase', 'Fase')]}
      {...props}
    />
  )
}

// The selection column's header is a nameless column header; it is not a column of ours.
const columnHeaders = () =>
  screen
    .getAllByRole('columnheader')
    .map((h) => h.textContent?.trim())
    .filter(Boolean)

/** The rows of items, in display order: the rows with a check of their own. */
const itemRows = () =>
  screen
    .getAllByRole('row')
    .filter((row) => within(row).queryByRole('checkbox', { name: strings.ListSelectRowLabel }))

const rowCheck = (index: number) =>
  within(itemRows()[index]).getByRole('checkbox', { name: strings.ListSelectRowLabel })

/** The titles of the items the last selection change reported. */
const reported = (onSelectionChange: jest.Mock) =>
  onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1][0].map(
    (item: Record<string, any>) => item.Title
  )

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

describe('List', () => {
  it('renders the title, the search box and the toolbar above the column headers', () => {
    renderList({
      title: 'Porteføljeoversikt',
      searchBox: { placeholder: 'Søk i Alle prosjekter' },
      menuItems: [new ListMenuItem('Eksporter til Excel')]
    })
    // WebPartTitle renders an <h2> around a span[role=heading]; both carry the text, so target the span.
    const heading = screen.getByText('Porteføljeoversikt', { selector: 'span' })
    const search = screen.getByPlaceholderText('Søk i Alle prosjekter')
    const toolbar = screen.getByRole('button', { name: 'Eksporter til Excel' })
    const firstHeader = screen.getAllByRole('columnheader')[0]
    // In this order on the page; the search box, the toolbar and the column headers are what stay
    // pinned when the list scrolls (CSS, which jsdom does not apply).
    const follows = (a: Node, b: Node) =>
      !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    expect(follows(heading, search)).toBe(true)
    expect(follows(search, toolbar)).toBe(true)
    expect(follows(toolbar, firstHeader)).toBe(true)
    expect(columnHeaders()).toEqual(['Tittel', 'Fase', strings.ToggleColumnFormPanelLabel])
  })

  it('shows the error in place of the search box and the toolbar', () => {
    renderList({
      error: { message: 'Kilden svarte ikke' } as Error,
      searchBox: { placeholder: 'Søk' },
      menuItems: [new ListMenuItem('Eksporter til Excel')]
    })
    expect(screen.getByText(strings.ErrorTitle)).toBeInTheDocument()
    expect(screen.getByText('Kilden svarte ikke')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Søk')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Eksporter til Excel' })).toBeNull()
  })

  it('renders one row per item, the title as a link to the project and the other cells as text', () => {
    renderList({
      items: [
        { Title: 'Alfa', Path: '/sites/alfa', GtProjectPhase: 'Konsept' },
        { Title: 'Bravo', GtProjectPhase: 'Planlegge' }
      ]
    })
    expect(itemRows()).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Alfa' })).toHaveAttribute('href', '/sites/alfa')
    expect(screen.getByText('Konsept')).toBeInTheDocument()
    // A project the user cannot open has no link, only its title and the explanation.
    expect(screen.queryByRole('link', { name: 'Bravo' })).toBeNull()
    expect(screen.getByText('Bravo')).toBeInTheDocument()
    expect(screen.getByTitle(strings.NoProjectData)).toBeInTheDocument()
  })

  it('renders a cell through its own renderer, its display field, its fallback or its configuration', () => {
    ColumnRenderComponentRegistry.registerMultiple(HubColumn)
    renderList({
      items: [
        {
          Title: 'Alfa',
          GtProjectOwner: 'i:0#.f|membership|kari@contoso.no',
          GtProjectOwnerText: 'Kari Nordmann',
          GtProjectPhase: 'Konsept',
          _hubTitle: 'Hub Nord'
        }
      ],
      columns: [
        column('Title', 'Tittel', { onRender: (item: any) => <em>{item.Title.toUpperCase()}</em> }),
        column('GtProjectOwner', 'Eier', { fieldNameDisplay: 'GtProjectOwnerText' }),
        column('GtBudgetTotal', 'Budsjett', {
          data: { dataTypeProperties: { fallbackValue: strings.NotSet } }
        }),
        column('GtProjectPhase', 'Fase', {
          data: { config: { Konsept: { iconName: 'Lightbulb', color: 'orange' } } }
        }),
        column('_hubTitle', 'Hub', { dataType: 'hub' })
      ]
    })
    expect(screen.getByText('ALFA').tagName).toBe('EM')
    expect(screen.getByText('Kari Nordmann')).toBeInTheDocument()
    expect(screen.queryByText(/membership/)).toBeNull()
    expect(screen.getByText(strings.NotSet)).toBeInTheDocument()
    const phase = screen.getByText('Konsept')
    expect(phase.parentElement?.querySelector('svg, i')).not.toBeNull()
    expect(screen.getByText('Hub Nord')).toBeInTheDocument()
  })

  it('leaves out hidden columns, and the add column when it is disabled', () => {
    renderList({
      columns: [
        column('Title', 'Tittel'),
        column('GtProjectPhase', 'Fase', { data: { isHidden: true } }),
        column('GtBudgetTotal', 'Budsjett', { internalName: 'GtBudgetTotal' })
      ],
      hiddenColumns: ['GtBudgetTotal'],
      isAddColumnEnabled: false
    })
    expect(columnHeaders()).toEqual(['Tittel'])
  })

  it('has the add column unless it is disabled, as the overview relies on', () => {
    renderList()
    expect(columnHeaders()).toEqual(['Tittel', 'Fase', strings.ToggleColumnFormPanelLabel])
  })

  it('reports a click and a right click on a column header to onColumnContextMenu', async () => {
    const user = setupUser()
    const onColumnContextMenu = jest.fn()
    renderList({ onColumnContextMenu })
    await user.click(screen.getByText('Fase'))
    expect(onColumnContextMenu).toHaveBeenCalledTimes(1)
    expect(onColumnContextMenu.mock.calls[0][0].column.key).toBe('GtProjectPhase')
    expect(onColumnContextMenu.mock.calls[0][0].target).toBeInstanceOf(HTMLElement)
    fireEvent.contextMenu(screen.getByText('Tittel'))
    expect(onColumnContextMenu).toHaveBeenCalledTimes(2)
    expect(onColumnContextMenu.mock.calls[1][0].column.key).toBe('Title')
  })

  it('marks the column the list is sorted by', () => {
    renderList({
      columns: [
        column('Title', 'Tittel'),
        column('GtProjectPhase', 'Fase', { isSorted: true, isSortedDescending: true })
      ]
    })
    expect(screen.getByRole('columnheader', { name: /Fase/ })).toHaveAttribute(
      'aria-sort',
      'descending'
    )
    expect(screen.getByRole('columnheader', { name: /Tittel/ })).not.toHaveAttribute(
      'aria-sort',
      'descending'
    )
  })

  it('shows the groups with their names and hides the rows of a collapsed group', () => {
    renderList({
      items: ITEMS.slice(0, 3),
      groups: [
        { key: 'g0', name: 'Fase: Konsept', startIndex: 0, count: 1 },
        { key: 'g1', name: 'Fase: Planlegge', startIndex: 1, count: 2, isCollapsed: true }
      ]
    })
    expect(screen.getByText('Fase: Konsept')).toBeInTheDocument()
    expect(screen.getByText('Fase: Planlegge')).toBeInTheDocument()
    expect(screen.getByText('Alfa')).toBeInTheDocument()
    expect(screen.queryByText('Bravo')).toBeNull()
    expect(screen.queryByText('Charlie')).toBeNull()
  })

  it('opens and closes a group from its header, and every group from the column headers', async () => {
    const user = setupUser()
    renderList({ items: ITEMS, groups: GROUPS })
    const planlegge = screen.getByRole('button', { name: /Fase: Planlegge/ })
    expect(planlegge).toHaveAttribute('aria-expanded', 'true')
    await user.click(planlegge)
    expect(planlegge).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Bravo')).toBeNull()
    expect(screen.getByText('Delta')).toBeInTheDocument()
    await user.click(planlegge)
    expect(screen.getByText('Bravo')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: strings.ListCollapseAllGroupsLabel }))
    expect(itemRows()).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: strings.ListExpandAllGroupsLabel }))
    expect(itemRows()).toHaveLength(4)
  })

  it('selects a row when its check is clicked, and reports the selected items', async () => {
    const user = setupUser()
    const onSelectionChange = jest.fn()
    renderList({ items: ITEMS.slice(0, 2), onSelectionChange })
    expect(itemRows()).toHaveLength(2)
    await user.click(rowCheck(1))
    expect(reported(onSelectionChange)).toEqual(['Bravo'])
    expect(rowCheck(1)).toBeChecked()
    await user.click(rowCheck(1))
    expect(reported(onSelectionChange)).toEqual([])
  })

  it('selects a row by a click on it, as the other lists do, and a range by a shift-click', () => {
    const onSelectionChange = jest.fn()
    renderList({ items: ITEMS, onSelectionChange })
    fireEvent.click(screen.getByText('Konsept'))
    expect(reported(onSelectionChange)).toEqual(['Alfa'])
    fireEvent.click(screen.getByText('Gjennomføre'), { shiftKey: true })
    expect(reported(onSelectionChange)).toEqual(['Alfa', 'Bravo', 'Charlie', 'Delta'])
    // A click on the check is one toggle, not one from the check and one from the row.
    fireEvent.click(rowCheck(3))
    expect(reported(onSelectionChange)).toEqual(['Alfa', 'Bravo', 'Charlie'])
  })

  it('leaves the selection alone when a link or a button in a row is clicked', () => {
    const onSelectionChange = jest.fn()
    renderList({
      items: ITEMS.slice(0, 1),
      columns: [
        column('Title', 'Tittel', { onRender: (item: any) => <button>{item.Title}</button> })
      ],
      onSelectionChange
    })
    fireEvent.click(screen.getByRole('button', { name: 'Alfa' }))
    expect(onSelectionChange).not.toHaveBeenCalled()
  })

  it('selects the rows between the last check and a shift-click', () => {
    const onSelectionChange = jest.fn()
    renderList({ items: ITEMS, onSelectionChange })
    fireEvent.click(rowCheck(0))
    fireEvent.click(rowCheck(2), { shiftKey: true })
    expect(reported(onSelectionChange)).toEqual(['Alfa', 'Bravo', 'Charlie'])
  })

  it('leaves the rows of a collapsed group out of a shift-click range', async () => {
    const user = setupUser()
    const onSelectionChange = jest.fn()
    renderList({ items: ITEMS, groups: GROUPS, onSelectionChange })
    await user.click(screen.getByRole('button', { name: /Fase: Planlegge/ }))
    // Alfa and Delta are the two rows on the screen now.
    fireEvent.click(rowCheck(0))
    fireEvent.click(rowCheck(1), { shiftKey: true })
    expect(reported(onSelectionChange)).toEqual(['Alfa', 'Delta'])
  })

  it('selects every item from the header check, a collapsed group included, and none again', async () => {
    const user = setupUser()
    const onSelectionChange = jest.fn()
    renderList({
      items: ITEMS,
      groups: GROUPS.map((group) => ({ ...group, isCollapsed: group.key === 'g1' })),
      onSelectionChange
    })
    const all = screen.getByRole('checkbox', { name: strings.ListSelectAllLabel })
    await user.click(all)
    expect(reported(onSelectionChange)).toEqual(['Alfa', 'Bravo', 'Charlie', 'Delta'])
    expect(all).toBeChecked()
    await user.click(all)
    expect(reported(onSelectionChange)).toEqual([])
  })

  it("selects a group's items from the group's check", async () => {
    const user = setupUser()
    const onSelectionChange = jest.fn()
    renderList({ items: ITEMS, groups: GROUPS, onSelectionChange })
    const group = screen.getByRole('checkbox', {
      name: format(strings.ListSelectGroupLabel, 'Fase: Planlegge')
    })
    await user.click(group)
    expect(reported(onSelectionChange)).toEqual(['Bravo', 'Charlie'])
    // Part of the list is selected, so the header check is neither checked nor clear.
    expect(
      screen.getByRole('checkbox', { name: strings.ListSelectAllLabel }) as HTMLInputElement
    ).toHaveProperty('indeterminate', true)
    await user.click(group)
    expect(reported(onSelectionChange)).toEqual([])
  })

  it('drops the selected items that leave the list', () => {
    const onSelectionChange = jest.fn()
    const { rerender } = render(
      <List
        items={ITEMS}
        columns={[column('Title', 'Tittel')]}
        onSelectionChange={onSelectionChange}
      />
    )
    fireEvent.click(rowCheck(0))
    fireEvent.click(rowCheck(1))
    expect(reported(onSelectionChange)).toEqual(['Alfa', 'Bravo'])
    // A search that leaves Alfa out: the export must not take it along unseen.
    rerender(
      <List
        items={ITEMS.slice(1)}
        columns={[column('Title', 'Tittel')]}
        onSelectionChange={onSelectionChange}
      />
    )
    expect(reported(onSelectionChange)).toEqual(['Bravo'])
    expect(rowCheck(0)).toBeChecked()
  })

  it('shows placeholder rows, and no items, while the data loads', () => {
    renderList({ items: [], enableShimmer: true })
    const grid = screen.getByRole('grid')
    expect(grid).toHaveAttribute('aria-busy', 'true')
    expect(within(grid).getAllByRole('row').length).toBeGreaterThan(1)
    expect(itemRows()).toHaveLength(0)
  })
})
