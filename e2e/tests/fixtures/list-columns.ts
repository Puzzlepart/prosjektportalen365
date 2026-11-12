import { expect, Locator, Page } from '@playwright/test'
import { baseURL } from '../../playwright.config'
import { findColumnsList } from './portfolio-overview-column'
import { webPart } from './pp365'
import { restGet } from './rest'

/**
 * The portfolio overview's columns, shared by the deployed and the local-bundle flow: the width a
 * column starts at, the tags it puts behind `+n` as it narrows and shows again as it widens, and
 * its width changed from the keyboard. A column's width is the grid's own state, gone on the next
 * load, so nothing is restored.
 */
const hub = baseURL.replace(/\/+$/, '')

/** The portfolio overview's grid. */
export function overviewGrid(page: Page) {
  return webPart(page, /porteføljeoversikt|portfolio overview/i)
    .first()
    .getByRole('grid')
    .first()
}

/** A header of the grid by its place in the header row, the selection cell's included. */
function headerAt(grid: Locator, index: number) {
  return grid.locator('[role="row"]').first().locator(':scope > *').nth(index)
}

/**
 * The column whose cells show more than one tag in the most rows, with its place in the row, or
 * `null` when no column does.
 */
export async function tagColumn(grid: Locator) {
  const index = await grid.evaluate((root) => {
    const rows = new Map<number, number>()
    for (const row of Array.from(root.querySelectorAll('[role="row"]'))) {
      Array.from(row.children).forEach((cell, i) => {
        if (cell.querySelectorAll('.fui-TagGroup .fui-Tag').length > 1) {
          rows.set(i, (rows.get(i) ?? 0) + 1)
        }
      })
    }
    const [most] = Array.from(rows.entries()).sort((a, b) => b[1] - a[1])
    return most ? most[0] : -1
  })
  return index < 0 ? null : { header: headerAt(grid, index), index }
}

/**
 * The tags of a column in the rows on screen: how many sit behind `+n`, and in how many cells the
 * group of tags is narrower than the cell. Rows out of view are left out: the browser skips their
 * layout (`content-visibility: auto`), so their tags are measured only once they are scrolled to.
 */
export function tagState(grid: Locator, index: number) {
  return grid.evaluate((root, column) => {
    let hidden = 0
    let narrower = 0
    for (const row of Array.from(root.querySelectorAll('[role="row"]'))) {
      const box = row.getBoundingClientRect()
      if (box.bottom < 0 || box.top > window.innerHeight) continue
      const cell = row.children[column] as HTMLElement | undefined
      const group = cell?.querySelector<HTMLElement>('.fui-TagGroup')
      const layout = cell?.querySelector<HTMLElement>('.fui-TableCellLayout')
      if (!group || !layout) continue
      hidden += Array.from(group.querySelectorAll<HTMLElement>('.fui-Tag')).filter(
        (tag) => tag.offsetParent === null
      ).length
      if (group.getBoundingClientRect().width < layout.getBoundingClientRect().width - 2) {
        narrower++
      }
    }
    return { hidden, narrower }
  }, index)
}

/**
 * Drags the handle at the edge of a column's header until the column is about `width` pixels
 * wide (0 for its least width), as far as the window reaches.
 */
export async function dragColumnTo(header: Locator, width: number) {
  await header.scrollIntoViewIfNeeded()
  const page = header.page()
  const cell = await header.boundingBox()
  const handle = await header.locator('.fui-TableResizeHandle').boundingBox()
  if (!cell || !handle) throw new Error('The column has no handle to resize it by')
  const x = handle.x + handle.width / 2
  const y = handle.y + handle.height / 2
  const to = Math.min(Math.max(cell.x + width, 5), page.viewportSize()!.width - 5)
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(to, y, { steps: 10 })
  await page.mouse.up()
}

/**
 * Narrows a tag column until tags go behind `+n`, widens it until they come back, and narrows it
 * again: the tags follow the column both ways, and each group of tags takes its cell's width.
 * Until 1.15.0 the group was as wide as the tags shown, so Fluent's `Overflow` never saw the
 * column grow. Returns why it could not run, when no column's tags overflow.
 */
export async function expectTagsFollowTheColumn(grid: Locator): Promise<string | undefined> {
  const column = await tagColumn(grid)
  if (!column) return 'no column of the list shows more than one tag in a cell'
  const { header, index } = column
  const hidden = async () => (await tagState(grid, index)).hidden

  await dragColumnTo(header, 0)
  const overflows = await expect
    .poll(hidden, { timeout: 5_000 })
    .toBeGreaterThan(0)
    .then(
      () => true,
      () => false
    )
  if (!overflows) return "no tags overflow even at the column's least width"
  const narrow = await hidden()

  await dragColumnTo(header, 800)
  await expect
    .poll(hidden, { message: 'the tags behind +n come back as the column widens' })
    .toBeLessThan(narrow)
  await expect
    .poll(async () => (await tagState(grid, index)).narrower, {
      message: 'each group of tags is as wide as its cell'
    })
    .toBe(0)

  await dragColumnTo(header, 0)
  await expect
    .poll(hidden, { message: 'the tags go behind +n again as the column narrows' })
    .toBeGreaterThan(0)
  return undefined
}

/**
 * The title column starts at its default width (`GtColMaxWidth` in the project columns list,
 * «Standard bredde»), not at its least: until 1.15.0 the overview started every column at its
 * least. Returns why it could not run, when the list gives the title no default width clearly
 * wider than its least.
 */
export async function expectTitleAtDefaultWidth(grid: Locator): Promise<string | undefined> {
  const page = grid.page()
  const list = await findColumnsList(page)
  const filter = encodeURIComponent("GtManagedProperty eq 'Title'")
  const response = await restGet(
    page,
    `${hub}/_api/web/lists(guid'${list.Id}')/items?$select=GtColMinWidth,GtColMaxWidth&$filter=${filter}`
  )
  const [title] = (
    (await response.json()) as { value: { GtColMinWidth: number; GtColMaxWidth: number }[] }
  ).value
  const least = title?.GtColMinWidth ?? 100
  const start = title?.GtColMaxWidth
  if (!start || start - least < 32) {
    return 'the title column has no default width clearly wider than its least'
  }
  const header = grid.getByRole('columnheader', { name: /^tittel$|^title$/i })
  const width = (await header.boundingBox())!.width
  // The header holds the column's width and Fluent's 16 px of padding.
  expect(width, 'the title column starts at its default width').toBeGreaterThanOrEqual(start)
  expect(width, 'the title column starts at its default width').toBeLessThanOrEqual(start + 32)
  return undefined
}

/**
 * Changes the title column's width from the keyboard alone (WCAG 2.1.1): Enter on its header opens
 * the column menu, «Endre kolonnebredde» puts the focus on the handle at the header's edge, named
 * in the page's language, the arrow keys widen the column, and Escape hands the focus back to the
 * header. Until 1.15.0 only a drag on that edge changed it.
 */
export async function expectKeyboardResize(grid: Locator) {
  const page = grid.page()
  const header = grid.getByRole('columnheader', { name: /^tittel$|^title$/i })
  const button = header.getByRole('button').first()
  await header.scrollIntoViewIfNeeded()
  const before = (await header.boundingBox())!.width

  await button.focus()
  await page.keyboard.press('Enter')
  const item = page.getByRole('menuitem', { name: /^endre kolonnebredde$|^resize column$/i })
  await expect(item).toBeVisible()
  await item.focus()
  await page.keyboard.press('Enter')

  const handle = page.getByRole('separator', { name: /tittel|title/i })
  await expect(handle, "the handle at the header's edge takes the focus").toBeFocused()
  await expect(handle).toHaveAttribute('aria-valuetext', /^\d+ (piksler|pixels)$/)
  for (let step = 0; step < 3; step++) await page.keyboard.press('ArrowRight')
  // Fluent widens a column by 20 px a key press.
  await expect
    .poll(async () => (await header.boundingBox())!.width, {
      message: 'the arrow keys widen the column'
    })
    .toBeGreaterThanOrEqual(before + 55)

  await page.keyboard.press('Escape')
  await expect(button, 'Escape hands the focus back to the header').toBeFocused()
  expect(
    (await header.boundingBox())!.width,
    'the column keeps its new width'
  ).toBeGreaterThanOrEqual(before + 55)
}
