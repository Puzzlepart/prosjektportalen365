import { fireEvent, render, screen } from '@testing-library/react'
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
    // The groups still open and close.
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

  it('adds its class name to the container', () => {
    const { container } = render(grid({ className: 'programGrid' }))
    expect(container.firstElementChild).toHaveClass('programGrid')
  })
})
