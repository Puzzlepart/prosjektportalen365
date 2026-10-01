import { IDataGridColumn } from './types'
import { COLUMN_PADDING, fitColumnWidths } from './fitColumnWidths'

/**
 * Sharing a container across columns: proportional to their preferred widths after Fluent's
 * per-column padding is set aside, floored at each column's minimum, and untouched when there is
 * no width to share.
 */
const column = (columnId: string, minWidth: number, defaultWidth?: number): IDataGridColumn =>
  ({ columnId, minWidth, defaultWidth }) as IDataGridColumn

describe('fitColumnWidths', () => {
  it('shares the container in proportion to the preferred widths', () => {
    // 900 less two paddings is 868: 578 and 289 by a 2:1 weight, floored.
    const options = fitColumnWidths([column('a', 50, 200), column('b', 50, 100)], 900)
    expect(options.a).toEqual({ minWidth: 50, defaultWidth: 578, idealWidth: 578 })
    expect(options.b).toEqual({ minWidth: 50, defaultWidth: 289, idealWidth: 289 })
  })

  it('sets aside the padding Fluent adds to every column, so the shares fill the container', () => {
    const options = fitColumnWidths([column('a', 50, 100), column('b', 50, 100)], 400)
    const total = options.a.defaultWidth! + options.b.defaultWidth! + 2 * COLUMN_PADDING
    expect(total).toBe(400)
  })

  it('never goes below a column minimum, so too many columns still overflow', () => {
    const options = fitColumnWidths([column('a', 100, 200), column('b', 100, 200)], 150)
    expect(options.a.defaultWidth).toBe(100)
    expect(options.b.defaultWidth).toBe(100)
  })

  it('uses the minimum as the preferred width when none is given', () => {
    // 800 less two paddings is 768, shared 1:3.
    const options = fitColumnWidths([column('a', 100), column('b', 300)], 800)
    expect(options.a.defaultWidth).toBe(192)
    expect(options.b.defaultWidth).toBe(576)
  })

  it('keeps the given widths when there is no container width yet', () => {
    const options = fitColumnWidths([column('a', 80, 200), column('b', 80)], 0)
    expect(options.a.defaultWidth).toBe(200)
    expect(options.b.defaultWidth).toBe(80)
  })
})
