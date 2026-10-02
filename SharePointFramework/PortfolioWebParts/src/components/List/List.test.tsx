// The title column can open ProjectWebParts' project information panel; that panel is not under
// test here, and loading its solution's module graph is what the mock avoids. jest.mock must come
// before the imports: Heft runs Jest on CommonJS output without Babel, so mocks are not hoisted.
jest.mock('pp365-projectwebparts/lib/components/ProjectInformationPanel', () => ({
  ProjectInformationPanel: () => null
}))
jest.mock('pp365-projectwebparts/lib/components/ProjectInformation', () => ({
  ProjectInformationPanel: () => null
}))

import { Selection } from '@fluentui/react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import strings from 'PortfolioWebPartsStrings'
import { ColumnRenderComponentRegistry, ListMenuItem } from 'pp365-shared-library'
import * as React from 'react'
import { HubColumn } from './ItemColumn/HubColumn'
import { List } from './List'
import { IListProps } from './types'

/**
 * The hub's list as the portfolio overview and the aggregated overview drive it: the header with
 * title, search box and toolbar above the column headers, one row per item with the cells rendered
 * through the column's own rules, hidden columns and the add column, the header click that opens
 * the column menu, groups, and the selection. Asserted through roles and text, so it holds when
 * the rows move from the v8 DetailsList to the v9 grid.
 */

type Column = Record<string, any>

function column(fieldName: string, name: string, extra: Column = {}): Column {
  return { key: fieldName, fieldName, name, minWidth: 100, dataType: 'text', ...extra }
}

function renderList(props: Partial<IListProps<any>> = {}) {
  const selection = new Selection()
  render(
    <List
      items={[{ Title: 'Alfa', Path: '/sites/alfa', GtProjectPhase: 'Konsept' }]}
      columns={[column('Title', 'Tittel'), column('GtProjectPhase', 'Fase')]}
      selection={selection}
      // jsdom has no layout, so the virtualized list would render nothing without this.
      onShouldVirtualize={() => false}
      {...props}
    />
  )
  return selection
}

// The selection column's header is a nameless column header; it is not a column of ours.
const columnHeaders = () =>
  screen
    .getAllByRole('columnheader')
    .map((h) => h.textContent?.trim())
    .filter(Boolean)
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
    expect(screen.getByPlaceholderText('Søk i Alle prosjekter')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eksporter til Excel' })).toBeInTheDocument()
    // The column headers sit in the same header block as the title and the command bar: that
    // block is what stays pinned when the list scrolls.
    const columnsBlock = document.querySelector('.headerColumns') as HTMLElement
    expect(within(columnsBlock).getAllByRole('columnheader').length).toBeGreaterThan(0)
    expect(heading.closest('.header')?.parentElement).toBe(columnsBlock.parentElement)
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
      hiddenColumns: ['GtBudgetTotal'] as any,
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
    // The header's click handler sits on the header cell's content, not on the cell itself.
    await user.click(screen.getByText('Fase'))
    expect(onColumnContextMenu).toHaveBeenCalledTimes(1)
    expect(onColumnContextMenu.mock.calls[0][0].column.key).toBe('GtProjectPhase')
    expect(onColumnContextMenu.mock.calls[0][0].target).toBeInstanceOf(HTMLElement)
    fireEvent.contextMenu(screen.getByText('Tittel'))
    expect(onColumnContextMenu).toHaveBeenCalledTimes(2)
    expect(onColumnContextMenu.mock.calls[1][0].column.key).toBe('Title')
  })

  it('shows the groups with their names and hides the rows of a collapsed group', () => {
    renderList({
      items: [
        { Title: 'Alfa', GtProjectPhase: 'Konsept' },
        { Title: 'Bravo', GtProjectPhase: 'Planlegge' },
        { Title: 'Charlie', GtProjectPhase: 'Planlegge' }
      ],
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

  it('selects a row through the selection when its check is clicked, and reports the change', async () => {
    const user = setupUser()
    const onSelectionChanged = jest.fn()
    const selection = new Selection({ onSelectionChanged })
    renderList({
      items: [
        { Title: 'Alfa', GtProjectPhase: 'Konsept' },
        { Title: 'Bravo', GtProjectPhase: 'Planlegge' }
      ],
      selection
    })
    // The header row has the select-all check; the item rows are the ones with cells.
    const rows = screen
      .getAllByRole('row')
      .filter(
        (row) =>
          within(row).queryAllByRole('gridcell').length > 0 && within(row).queryByRole('checkbox')
      )
    expect(rows).toHaveLength(2)
    await user.click(within(rows[1]).getByRole('checkbox'))
    expect(onSelectionChanged).toHaveBeenCalled()
    expect(selection.getSelectedCount()).toBe(1)
    expect((selection.getSelection()[0] as any).Title).toBe('Bravo')
    await user.click(within(rows[1]).getByRole('checkbox'))
    expect(selection.getSelectedCount()).toBe(0)
  })
})
