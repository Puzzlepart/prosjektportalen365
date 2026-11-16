import { act, fireEvent, render, screen, within } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import { IListColumn } from 'pp365-shared-library'
import * as React from 'react'
import { ListGrid } from './ListGrid'
import { IListGridProps } from './types'

/**
 * The hub's grid as other lists use it (the program administration's): without a selection for a
 * user who may only look, and with a selection its owner keeps, which the grid shows and reports
 * changes to without keeping one of its own. Also what the hub's list hands it from a column's
 * data type: something to show under the column's name, which comes and goes with the column's
 * data while the header keeps its button, and the least width the column's data needs. The hub's
 * own use is covered by `List.test.tsx`.
 */

const ITEMS = [{ Title: 'Alfa' }, { Title: 'Bravo' }, { Title: 'Charlie' }]

const COLUMNS: IListGridProps['columns'] = [
  { key: 'Title', fieldName: 'Title', name: 'Tittel', minWidth: 100 }
]

const TWO_COLUMNS: IListGridProps['columns'] = [
  ...COLUMNS,
  { key: 'Phase', fieldName: 'Phase', name: 'Fase', minWidth: 100 }
]

/** Something under the phase column's name only, as a data type adds to its own columns. */
function phaseAddon(column: IListColumn) {
  return column.key === 'Phase' ? <span>Fr Øk Kv</span> : null
}

const GROUPS = [
  { key: 'hub1', name: 'Hub 1', startIndex: 0, count: 2 },
  { key: 'hub2', name: 'Hub 2', startIndex: 2, count: 1 }
]

function grid(props: Partial<IListGridProps> = {}) {
  return <ListGrid items={ITEMS} columns={COLUMNS} renderCell={(item) => item.Title} {...props} />
}

const rowChecks = () => screen.queryAllByRole('checkbox', { name: strings.ListSelectRowLabel })
const checked = () => rowChecks().map((check) => (check as HTMLInputElement).checked)

describe('ListGrid', () => {
  it('offers no selection when selectionMode is none: no checks, and a click on a row selects nothing', () => {
    const onSelectionChange = jest.fn()
    render(grid({ selectionMode: 'none', groups: GROUPS, onSelectionChange }))
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    expect(screen.getByRole('grid')).not.toHaveAttribute('aria-multiselectable')
    fireEvent.click(screen.getByText('Bravo'))
    expect(onSelectionChange).not.toHaveBeenCalled()
    expect(screen.getByText('Hub 1')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('shows the selection it is given and reports a change, keeping none of its own', () => {
    const onSelectionChange = jest.fn()
    const { rerender } = render(grid({ selectedItems: [ITEMS[0]], onSelectionChange }))
    expect(checked()).toEqual([true, false, false])
    // Given, not changed: nothing to report.
    expect(onSelectionChange).not.toHaveBeenCalled()

    fireEvent.click(rowChecks()[2])
    expect(onSelectionChange).toHaveBeenLastCalledWith([ITEMS[0], ITEMS[2]])
    // The grid shows what its owner passes, until the owner passes the change.
    expect(checked()).toEqual([true, false, false])

    // The owner clears it (as the program administration does once projects are added).
    rerender(grid({ selectedItems: [], onSelectionChange }))
    expect(checked()).toEqual([false, false, false])

    fireEvent.click(screen.getByRole('checkbox', { name: strings.ListSelectAllLabel }))
    expect(onSelectionChange).toHaveBeenLastCalledWith(ITEMS)
  })

  it("selects a group's items from the group's check under a given selection", () => {
    const onSelectionChange = jest.fn()
    render(grid({ selectedItems: [], groups: GROUPS, onSelectionChange }))
    fireEvent.click(
      screen.getByRole('checkbox', { name: strings.ListSelectGroupLabel.replace('{0}', 'Hub 1') })
    )
    expect(onSelectionChange).toHaveBeenLastCalledWith([ITEMS[0], ITEMS[1]])
  })

  it('forgets the groups closed by hand when its collapse state key changes', () => {
    const { rerender } = render(grid({ groups: GROUPS }))
    fireEvent.click(screen.getByText('Hub 1'))
    expect(screen.queryByText('Alfa')).not.toBeInTheDocument()
    rerender(grid({ groups: GROUPS }))
    expect(screen.queryByText('Alfa')).not.toBeInTheDocument()
    // The program administration changes this key when its search should reopen groups.
    rerender(grid({ groups: GROUPS, collapseStateKey: 'alfa' }))
    expect(screen.getByText('Alfa')).toBeInTheDocument()
  })

  it('sends a right click on a column header to its own handler, and leaves it to the browser without one', () => {
    const onColumnHeaderClick = jest.fn()
    const { rerender } = render(grid({ onColumnHeaderClick }))
    // Not prevented: the browser's own menu opens, and nothing sorts.
    expect(fireEvent.contextMenu(screen.getByText('Tittel'))).toBe(true)
    expect(onColumnHeaderClick).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Tittel'))
    expect(onColumnHeaderClick).toHaveBeenCalledTimes(1)

    const onColumnHeaderContextMenu = jest.fn()
    rerender(grid({ onColumnHeaderClick, onColumnHeaderContextMenu }))
    expect(fireEvent.contextMenu(screen.getByText('Tittel'))).toBe(false)
    expect(onColumnHeaderContextMenu).toHaveBeenCalledWith(
      COLUMNS[0],
      expect.any(HTMLElement),
      expect.any(Function)
    )
    expect(onColumnHeaderClick).toHaveBeenCalledTimes(1)
  })

  it('adds its class name to the container', () => {
    const { container } = render(grid({ className: 'programGrid' }))
    expect(container.firstElementChild).toHaveClass('programGrid')
  })

  it('says that a column header opens a menu, marks it for the focus to come back to, and that a group spans its row (WCAG 1.3.1, 2.4.3, 4.1.2)', () => {
    render(grid({ onColumnHeaderClick: jest.fn(), headerOpensMenu: true, groups: GROUPS }))
    const header = screen.getByText('Tittel').closest('[role="button"], button')
    expect(header).toHaveAttribute('aria-haspopup', 'menu')
    // The menu opens from state, with no trigger of Fluent's to give the focus back to.
    expect(header.getAttribute('data-tabster')).toContain('"restorer"')
    // Named by its tooltip, not by a title of the same text as well.
    const all = screen.getByRole('button', { name: strings.ListCollapseAllGroupsLabel })
    expect(all).not.toHaveAttribute('title')
    expect(screen.getByText('Hub 1').closest('[role="gridcell"]')).toHaveAttribute(
      'aria-colspan',
      String(COLUMNS.length + 1)
    )
  })

  it('leaves a header that sorts as a plain button', () => {
    render(grid({ onColumnHeaderClick: jest.fn() }))
    expect(screen.getByText('Tittel').closest('[role="button"], button')).not.toHaveAttribute(
      'aria-haspopup'
    )
  })

  it("hands the column menu the keyboard's way to resize the column, its handle named in the page's language (WCAG 2.1.1)", () => {
    // Only a drag on the header's edge changed a column's width, and Fluent names the handle
    // «Resize column» and its value «… pixels», in English.
    const onColumnHeaderClick = jest.fn()
    render(grid({ onColumnHeaderClick, headerOpensMenu: true }))
    fireEvent.click(screen.getByText('Tittel'))
    const resizeColumn = onColumnHeaderClick.mock.calls[0][2]
    const handle = document.querySelector<HTMLElement>('.fui-TableResizeHandle')
    // SharedLibraryStrings' Aria.ColumnResizeHandleLabel and Aria.ColumnWidthValueText, shared
    // with the dynamic list's table (nameColumnResizeHandle).
    expect(handle).toHaveAttribute('aria-label', 'Bredde på kolonnen Tittel')
    expect(handle).toHaveAttribute('aria-valuetext', '100 piksler')
    // As the menu item's click does: the focus goes to the handle, and the arrow keys resize.
    act(() =>
      resizeColumn({ preventDefault: jest.fn(), nativeEvent: { stopPropagation: jest.fn() } })
    )
    expect(handle).toHaveFocus()
    fireEvent.keyDown(handle, { key: 'ArrowRight' })
    expect(handle).toHaveAttribute('aria-valuetext', '120 piksler')
  })

  it("gives a cell's content its column's whole width, so tags behind +n come back as it widens", () => {
    // Fluent sizes a cell's content by what it shows, and the tags' Overflow measures that box.
    render(grid())
    expect(screen.getByText('Bravo').closest('.fui-TableCellLayout__content').className).toMatch(
      /cellContent/
    )
  })

  it("shows what a column adds under its name beside the header's button, hidden from assistive technology and outside the button's name and click (WCAG 2.5.3, 4.1.2)", async () => {
    const onColumnHeaderClick = jest.fn()
    render(grid({ columns: TWO_COLUMNS, onColumnHeaderClick, renderHeaderAddon: phaseAddon }))
    const header = screen.getByRole('columnheader', { name: 'Fase' })
    const button = within(header).getByRole('button', { name: 'Fase' })
    const addon = screen.getByText('Fr Øk Kv')
    // In the header cell beside its button, so not part of the button's name, ellipsis or click.
    expect(addon.closest('[aria-hidden="true"]').parentElement).toBe(header)
    expect(button).not.toContainElement(addon)
    expect(header.className).toMatch(/headerCellStacked/)
    fireEvent.click(addon)
    expect(onColumnHeaderClick).not.toHaveBeenCalled()
    fireEvent.click(button)
    expect(onColumnHeaderClick).toHaveBeenCalledWith(TWO_COLUMNS[1], button, expect.any(Function))
    // The header beside it, with nothing to add, is as it was: its button and its resize handle.
    const title = screen.getByRole('columnheader', { name: 'Tittel' })
    expect(title.className).not.toMatch(/headerCellStacked/)
    expect(title.children).toHaveLength(2)
    expect(await axeComponent(header)).toHaveNoViolations()
  })

  it('leaves every header as it was when no column adds anything', () => {
    // false renders nothing, as `hasData && <Legend />` gives without data.
    const { container } = render(grid({ columns: TWO_COLUMNS, renderHeaderAddon: () => false }))
    expect(container.querySelector('[class*="headerCellStacked"]')).toBeNull()
    expect(container.querySelector('[class*="headerAddon"]')).toBeNull()
    expect(screen.getByRole('columnheader', { name: 'Fase' }).children).toHaveLength(2)
  })

  it("keeps a header's button, and the focus on it, when the column's addon comes or goes", () => {
    // The overview's data reaches a column after the first render, under the same key, and a
    // failed fetch takes it away again; a header the user is on must stay the same element.
    let legend: React.ReactNode = null
    const renderHeaderAddon = (column: IListColumn) => (column.key === 'Phase' ? legend : null)
    const props = { columns: TWO_COLUMNS, renderHeaderAddon }
    const { rerender } = render(grid(props))
    const button = screen.getByRole('button', { name: 'Fase' })
    act(() => button.focus())
    expect(button).toHaveFocus()

    legend = <span>Fr Øk Kv</span>
    rerender(grid(props))
    expect(screen.getByText('Fr Øk Kv')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fase' })).toBe(button)
    expect(button).toHaveFocus()

    legend = null
    rerender(grid(props))
    expect(screen.queryByText('Fr Øk Kv')).toBeNull()
    expect(screen.getByRole('button', { name: 'Fase' })).toBe(button)
    expect(button).toHaveFocus()
  })

  it('keeps a column at least as wide as its data needs, also when the data comes later to the same columns', () => {
    // The overview puts a column's data on the column object and keeps the columns array, so the
    // width the data needs changes while the columns and the function stay the same.
    const columns: IListGridProps['columns'] = [{ ...COLUMNS[0], maxWidth: 180 }]
    let needed: number | undefined
    const getColumnMinWidth = () => needed
    const onColumnHeaderClick = jest.fn()
    const props = { columns, getColumnMinWidth, onColumnHeaderClick }
    const { rerender } = render(grid(props))
    const handle = () => document.querySelector<HTMLElement>('.fui-TableResizeHandle')
    expect(handle()).toHaveAttribute('aria-valuetext', '180 piksler')

    needed = 226
    rerender(grid(props))
    // Not its preferred 180, which Fluent would take as is for a column it already sizes.
    expect(handle()).toHaveAttribute('aria-valuetext', '226 piksler')
    // Nor narrower from the keyboard, through the column menu.
    fireEvent.click(screen.getByText('Tittel'))
    const resizeColumn = onColumnHeaderClick.mock.calls[0][2]
    act(() =>
      resizeColumn({ preventDefault: jest.fn(), nativeEvent: { stopPropagation: jest.fn() } })
    )
    fireEvent.keyDown(handle(), { key: 'ArrowLeft' })
    expect(handle()).toHaveAttribute('aria-valuetext', '226 piksler')
  })
})
