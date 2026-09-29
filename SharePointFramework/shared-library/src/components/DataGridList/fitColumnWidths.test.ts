import { IDataGridColumn } from './types'
import { fitColumnWidths } from './fitColumnWidths'

/**
 * Sharing a container across columns: proportional to their preferred widths, floored at each
 * column's minimum, and untouched when there is no width to share.
 */
const column = (columnId: string, minWidth: number, defaultWidth?: number): IDataGridColumn =>
  ({ columnId, minWidth, defaultWidth }) as IDataGridColumn

describe('fitColumnWidths', () => {
  it('shares the container in proportion to the preferred widths', () => {
    const options = fitColumnWidths([column('a', 50, 200), column('b', 50, 100)], 900)
    expect(options.a).toEqual({ minWidth: 50, defaultWidth: 600, idealWidth: 600 })
    expect(options.b).toEqual({ minWidth: 50, defaultWidth: 300, idealWidth: 300 })
  })

  it('never goes below a column minimum, so too many columns still overflow', () => {
    const options = fitColumnWidths([column('a', 100, 200), column('b', 100, 200)], 150)
    expect(options.a.defaultWidth).toBe(100)
    expect(options.b.defaultWidth).toBe(100)
  })

  it('uses the minimum as the preferred width when none is given', () => {
    const options = fitColumnWidths([column('a', 100), column('b', 300)], 800)
    expect(options.a.defaultWidth).toBe(200)
    expect(options.b.defaultWidth).toBe(600)
  })

  it('keeps the given widths when there is no container width yet', () => {
    const options = fitColumnWidths([column('a', 80, 200), column('b', 80)], 0)
    expect(options.a.defaultWidth).toBe(200)
    expect(options.b.defaultWidth).toBe(80)
  })
})
