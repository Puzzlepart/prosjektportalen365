import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { IListColumn } from '../types'
import { createDataGridColumns } from './createDataGridColumns'

/**
 * The mapping from the solutions' columns to `DataGrid`'s, checked through what the resulting
 * header and cells render and the sizing they ask for.
 */

const columns: IListColumn[] = [
  { key: 'Title', fieldName: 'Title', name: 'Tittel', minWidth: 100, maxWidth: 250 },
  { key: 'Status', fieldName: 'Status', name: 'Status', minWidth: 80 },
  {
    key: 'Owner',
    fieldName: 'Owner',
    name: 'Eier',
    minWidth: 120,
    onRender: (item) => <strong>{item.Owner.toUpperCase()}</strong>
  }
]

const item = { Title: 'Risiko A', Status: 'Åpen', Owner: 'Kari' }

describe('createDataGridColumns', () => {
  it('keeps the columns in order, keyed by the column key', () => {
    const { columns: grid } = createDataGridColumns(columns)
    expect(grid.map((c) => c.columnId)).toEqual(['Title', 'Status', 'Owner'])
  })

  it('uses the column name as the header', () => {
    const { columns: grid } = createDataGridColumns(columns)
    render(<>{grid[0].renderHeaderCell()}</>)
    expect(screen.getByText('Tittel')).toBeInTheDocument()
  })

  it("shows the item's value for the column's field", () => {
    const { columns: grid } = createDataGridColumns(columns)
    render(<>{grid[1].renderCell(item)}</>)
    expect(screen.getByText('Åpen')).toBeInTheDocument()
  })

  it("lets a column's own renderer draw the cell", () => {
    const { columns: grid } = createDataGridColumns(columns)
    render(<>{grid[2].renderCell(item)}</>)
    expect(screen.getByText('KARI')).toBeInTheDocument()
  })

  it('offers the full text on hover for a text cell only', () => {
    const { columns: grid } = createDataGridColumns(columns)
    const { container } = render(
      <>
        {grid[0].renderCell(item)}
        {grid[2].renderCell(item)}
      </>
    )
    const titles = Array.from(container.querySelectorAll('[title]')).map((el) =>
      el.getAttribute('title')
    )
    expect(titles).toEqual(['Risiko A'])
  })

  it('sizes each column from its widths, defaulting to the narrowest when no widest is given', () => {
    const { columnSizingOptions } = createDataGridColumns(columns)
    expect(columnSizingOptions).toEqual({
      Title: { minWidth: 100, defaultWidth: 250 },
      Status: { minWidth: 80, defaultWidth: 80 },
      Owner: { minWidth: 120, defaultWidth: 120 }
    })
  })
})
