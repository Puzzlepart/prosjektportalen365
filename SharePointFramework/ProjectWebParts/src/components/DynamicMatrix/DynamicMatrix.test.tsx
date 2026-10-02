import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { DynamicMatrix } from './DynamicMatrix'
import { generateMatrixConfiguration } from './generateMatrixConfiguration'
import { MatrixCellType } from './MatrixCell'

/**
 * The matrix grid: a configuration generated from the headers, with the top row and the left
 * column as headers and the cells addressed by x and y, and the elements each cell is given.
 */
const headers = {
  4: [
    [undefined, 'Ubetydelig', 'Liten', 'Moderat', 'Alvorlig'],
    ['Svært høy', 'Høy', 'Middels', 'Lav']
  ]
}

describe('generateMatrixConfiguration', () => {
  it('builds a header row, then one row per size with its header first and the cells addressed by x and y', () => {
    const configuration = generateMatrixConfiguration(4, headers)
    expect(configuration).toHaveLength(5)
    expect(configuration[0].map((c) => c.cellValue)).toEqual(headers[4][0])
    expect(configuration[0].every((c) => c.cellType === MatrixCellType.Header)).toBe(true)
    expect(configuration[1][0]).toEqual({ cellValue: 'Svært høy', cellType: MatrixCellType.Header })
    expect(configuration[1].slice(1).map((c) => [c.x, c.y])).toEqual([
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 4]
    ])
    expect(configuration[4].slice(1).map((c) => [c.x, c.y])).toEqual([
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1]
    ])
  })
})

describe('DynamicMatrix', () => {
  it('draws the headers and places the elements in their cells', () => {
    const configuration = generateMatrixConfiguration(4, headers)
    const items = [
      { id: 1, probability: 4, consequence: 1, tooltip: 'Risiko 1', item: { Title: 'Risiko 1' } },
      { id: 2, probability: 1, consequence: 4, tooltip: 'Risiko 2', item: { Title: 'Risiko 2' } }
    ]
    render(
      <DynamicMatrix
        configuration={configuration}
        width='100%'
        calloutTemplate='<b>{Title}</b>'
        getElementsForCell={(cell) =>
          items
            .filter((item) => item.probability === cell.y && item.consequence === cell.x)
            .map((item) => ({ model: item, title: item.item.Title }))
        }
      />
    )
    for (const header of ['Ubetydelig', 'Alvorlig', 'Svært høy', 'Lav']) {
      expect(screen.getByText(header)).toBeInTheDocument()
    }
    expect(screen.getByTitle('Risiko 1')).toHaveTextContent('1')
    expect(screen.getByTitle('Risiko 2')).toHaveTextContent('2')
  })
})
