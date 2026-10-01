import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createTableColumn } from '@fluentui/react-components'
import * as React from 'react'
import { IListColumn } from '../../types'
import { createDataGridColumns } from '../../util/createDataGridColumns'
import { DataGridList } from './DataGridList'
import { IDataGridColumn } from './types'

/**
 * The shared v9 list: rows under headers, sorting by header click, selection, row double-click and
 * the empty state, asserted through roles and text. Also the proof that the v9 `DataGrid`'s
 * interactions survive this harness, which its render-only uses in slice 6 did not give.
 */

type Row = { id: string; name: string; amount: number }

const items: Row[] = [
  { id: 'b', name: 'Bravo', amount: 20 },
  { id: 'a', name: 'Alfa', amount: 30 },
  { id: 'c', name: 'Charlie', amount: 10 }
]

const columns: IDataGridColumn<Row>[] = [
  {
    ...createTableColumn<Row>({
      columnId: 'name',
      compare: (a, b) => a.name.localeCompare(b.name),
      renderHeaderCell: () => 'Navn',
      renderCell: (item) => item.name
    }),
    minWidth: 100,
    defaultWidth: 200
  },
  {
    ...createTableColumn<Row>({
      columnId: 'amount',
      compare: (a, b) => a.amount - b.amount,
      renderHeaderCell: () => 'Beløp',
      renderCell: (item) => String(item.amount)
    }),
    minWidth: 60
  }
]

/**
 * The names in the order the rows show them. With selection on, the first cell of a row is its
 * checkbox, so the name is read from the first cell that has text.
 */
const rowNames = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map(
      (row) =>
        Array.from(row.querySelectorAll('[role=gridcell]'))
          .map((cell) => cell.textContent.trim())
          .find((text) => text.length > 0) ?? ''
    )

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

describe('DataGridList', () => {
  it('shows the rows under the column headers, in the given order', () => {
    render(<DataGridList items={items} columns={columns} getRowId={(item) => item.id} />)
    expect(screen.getByText('Navn')).toBeInTheDocument()
    expect(screen.getByText('Beløp')).toBeInTheDocument()
    expect(rowNames()).toEqual(['Bravo', 'Alfa', 'Charlie'])
  })

  it('applies the default sort', () => {
    render(
      <DataGridList
        items={items}
        columns={columns}
        getRowId={(item) => item.id}
        sortable
        defaultSortState={{ sortColumn: 'name', sortDirection: 'ascending' }}
      />
    )
    expect(rowNames()).toEqual(['Alfa', 'Bravo', 'Charlie'])
  })

  it('sorts by a column when its header is clicked, and reverses on the second click', async () => {
    const user = setupUser()
    render(<DataGridList items={items} columns={columns} getRowId={(item) => item.id} sortable />)
    await user.click(screen.getByText('Beløp'))
    expect(rowNames()).toEqual(['Charlie', 'Bravo', 'Alfa'])
    await user.click(screen.getByText('Beløp'))
    expect(rowNames()).toEqual(['Alfa', 'Bravo', 'Charlie'])
  })

  it('reports the selected rows by their ids', async () => {
    const user = setupUser()
    const onSelectionChange = jest.fn()
    render(
      <DataGridList
        items={items}
        columns={columns}
        getRowId={(item) => item.id}
        selectionMode='multiselect'
        onSelectionChange={onSelectionChange}
      />
    )
    // The first checkbox selects all; the rest are one per row, in row order.
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[2])
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a'])
    await user.click(checkboxes[1])
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b'])
  })

  it('shows the rows given as selected', () => {
    render(
      <DataGridList
        items={items}
        columns={columns}
        getRowId={(item) => item.id}
        selectionMode='multiselect'
        selectedItems={['c']}
      />
    )
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[3]).toBeChecked()
    expect(checkboxes[1]).not.toBeChecked()
  })

  it('clears a single selection when the selected row is clicked again', async () => {
    const user = setupUser()
    const onSelectionChange = jest.fn()
    const grid = (selected: string[]) => (
      <DataGridList
        items={items}
        columns={columns}
        getRowId={(item) => item.id}
        selectionMode='single'
        selectedItems={selected}
        onSelectionChange={onSelectionChange}
      />
    )
    const { rerender } = render(grid([]))
    const row = () => screen.getByText('Alfa').closest('[role=row]')
    await user.click(row())
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a'])
    // The owner keeps the selection, as the target folder screen does.
    rerender(grid(['a']))
    await user.click(row())
    expect(onSelectionChange).toHaveBeenLastCalledWith([])
  })

  it('invokes a row on double-click', async () => {
    const user = setupUser()
    const onRowDoubleClick = jest.fn()
    render(
      <DataGridList
        items={items}
        columns={columns}
        getRowId={(item) => item.id}
        onRowDoubleClick={onRowDoubleClick}
      />
    )
    await user.dblClick(screen.getByText('Alfa'))
    expect(onRowDoubleClick).toHaveBeenCalledWith(items[1])
  })

  it('shows the empty content instead of an empty grid', () => {
    render(<DataGridList items={[]} columns={columns} emptyContent={<p>Ingen elementer</p>} />)
    expect(screen.getByText('Ingen elementer')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it("takes the solutions' own columns through createDataGridColumns", () => {
    const listColumns: IListColumn[] = [
      { key: 'name', fieldName: 'name', name: 'Navn', minWidth: 100 },
      { key: 'amount', fieldName: 'amount', name: 'Beløp', minWidth: 60, maxWidth: 90 }
    ]
    const { columns: fromList } = createDataGridColumns<Row>(listColumns)
    render(<DataGridList items={items} columns={fromList} getRowId={(item) => item.id} />)
    expect(screen.getByText('Navn')).toBeInTheDocument()
    expect(rowNames()).toEqual(['Bravo', 'Alfa', 'Charlie'])
  })
})
