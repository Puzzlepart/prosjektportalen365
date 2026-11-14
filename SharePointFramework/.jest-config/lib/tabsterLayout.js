/**
 * A layout for Tabster, the focus manager under Fluent UI v9's arrow keys and focus traps, in
 * component tests that press Tab and the arrows (Puzzlepart/prosjektportalen365-testing#130).
 * Usage, in a solution's test:
 *
 *   import { layOutForTabster } from 'pp365-jest-config/lib/tabsterLayout'
 *
 *   const restore = layOutForTabster()
 *   try { ... } finally { restore() }
 *
 * jsdom lays nothing out. Tabster takes an element whose `offsetParent` is null for hidden, and
 * jsdom's is always null, so Tab into a Fluent grid or toolbar found nothing and the focus fell
 * to the page. Here every element is offset by its parent. Tabster finds the cell above, below
 * or beside by the boxes of the cells; here each element in a row of a grid has a box by the
 * row's place among the rows and its cell's place in the row, 100 by 40 pixels, and anything
 * else a box of the page.
 *
 * @returns {() => void} Puts jsdom back as it was
 */
function layOutForTabster() {
  const offsetParent = jest
    .spyOn(HTMLElement.prototype, 'offsetParent', 'get')
    .mockImplementation(function () {
      return this.parentElement
    })
  const box = (left, top, width, height) => ({
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({})
  })
  const CELL = '[role="gridcell"], [role="columnheader"], [role="rowheader"]'
  const rect = jest
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function () {
      const row = this.closest('[role="row"]')
      if (!row) return box(0, 0, 1024, 768)
      const rows = Array.from(document.querySelectorAll('[role="row"]'))
      const cells = Array.from(row.querySelectorAll(CELL))
      const column = Math.max(cells.indexOf(this.closest(CELL)), 0)
      return box(column * 100, rows.indexOf(row) * 40, 100, 40)
    })
  return () => {
    offsetParent.mockRestore()
    rect.mockRestore()
  }
}

module.exports = { layOutForTabster }
