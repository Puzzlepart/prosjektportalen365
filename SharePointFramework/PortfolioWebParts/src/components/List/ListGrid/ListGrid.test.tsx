import { act, fireEvent, render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { ListGrid } from './ListGrid'
import { IListGridProps } from './types'

/**
 * The hub's grid as other lists use it (the program administration's): without a selection for a
 * user who may only look, and with a selection its owner keeps, which the grid shows and reports
 * changes to without keeping one of its own. The hub's own use is covered by `List.test.tsx`.
 */

const ITEMS = [{ Title: 'Alfa' }, { Title: 'Bravo' }, { Title: 'Charlie' }]

const COLUMNS: IListGridProps['columns'] = [
  { key: 'Title', fieldName: 'Title', name: 'Tittel', minWidth: 100 }
]

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
})
