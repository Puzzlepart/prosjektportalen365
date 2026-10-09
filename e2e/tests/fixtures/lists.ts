import { expect, Locator, Page } from '@playwright/test'

/**
 * The lists' look, measured in the browser: the typography every list shares, and whether a
 * list's column headers stay in view as it scrolls. Fluent's own class names find the parts of
 * every kind of list there is: the hub's grid (`ListGrid`), `DataGridList` and the dynamic list's
 * table all render Fluent's `Table` parts.
 */

/** Fluent's `colorNeutralForeground3`, the lighter grey of the values. */
export const VALUE_COLOR = 'rgb(97, 97, 97)'

/** The typography of a list: its column names and the text in its first rows. */
export interface ListTypography {
  headers: Array<{ text: string; fontSize: string; fontWeight: number }>
  /** Each distinct font size of the text in the cells, with an example of the text. */
  cellFontSizes: Record<string, string>
  /** Each distinct colour of the cells themselves. */
  cellColors: string[]
}

/** Measures the column names and the text of the first rows of the first list in `scope`. */
export async function measureListTypography(scope: Locator): Promise<ListTypography> {
  const firstCell = scope.locator('.fui-TableBody .fui-TableCell').first()
  await expect(firstCell).toBeVisible({ timeout: 90_000 })
  // Let the rows and their cell renderers settle.
  await scope.page().waitForTimeout(2000)
  return scope.evaluate((root) => {
    const textElements = (element: Element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      const parents: HTMLElement[] = []
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.textContent?.trim() && node.parentElement) parents.push(node.parentElement)
      }
      return parents
    }
    const headers = Array.from(root.querySelectorAll('.fui-TableHeaderCell'))
      .map((cell) => {
        // The name: the longest text in the cell, not the column's icon (a Fabric font glyph).
        const element = textElements(cell).sort(
          (a, b) => (b.textContent || '').trim().length - (a.textContent || '').trim().length
        )[0]
        if (!element) return null
        const style = getComputedStyle(element)
        return {
          text: (element.textContent || '').trim().slice(0, 30),
          fontSize: style.fontSize,
          fontWeight: Number(style.fontWeight)
        }
      })
      .filter(Boolean) as Array<{ text: string; fontSize: string; fontWeight: number }>
    // The rows of items: a group's row holds the button that opens and closes it, in its own type.
    const cells = Array.from(root.querySelectorAll('.fui-TableBody .fui-TableRow'))
      .filter((row) => !row.querySelector('button[aria-expanded]'))
      .flatMap((row) => Array.from(row.querySelectorAll('.fui-TableCell')))
      .slice(0, 120)
    const cellFontSizes: Record<string, string> = {}
    for (const cell of cells) {
      for (const element of textElements(cell)) {
        const size = getComputedStyle(element).fontSize
        cellFontSizes[size] ??= (element.textContent || '').trim().slice(0, 30)
      }
    }
    const cellColors = Array.from(new Set(cells.map((cell) => getComputedStyle(cell).color)))
    return { headers, cellFontSizes, cellColors }
  })
}

/**
 * What every list shows, as 1.14's v8 lists did: column names at 14px semibold, the values at
 * 12px in the lighter grey, and links at the size of the text around them.
 */
export function expectListTypography(typography: ListTypography) {
  expect(typography.headers.length, 'the list has column names').toBeGreaterThan(0)
  for (const header of typography.headers) {
    expect(header.fontSize, `column name "${header.text}"`).toBe('14px')
    expect(header.fontWeight, `column name "${header.text}" is semibold`).toBeGreaterThanOrEqual(
      600
    )
  }
  expect(
    typography.cellFontSizes,
    'every text in the rows, links and tags included, is 12px (each size with an example)'
  ).toEqual({ '12px': expect.any(String) })
  expect(typography.cellColors, 'the cells are in the lighter grey').toEqual([VALUE_COLOR])
}

type Box = { x: number; y: number; width: number; height: number }

/** The header row of a list and its scroll container, after scrolling the container by `by`. */
export async function scrollUnderHeader(
  header: Locator,
  container: Locator,
  by: number
): Promise<{ header: Box; container: Box; headerOnTop: boolean }> {
  await container.evaluate((element, distance) => {
    element.scrollTop += distance
  }, by)
  await header.page().waitForTimeout(500)
  const headerBox = (await header.boundingBox())!
  const containerBox = (await container.boundingBox())!
  // Drawn on top of the rows it covers: the element at its middle is the header or in it.
  const headerOnTop = await header.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
    return !!hit && element.contains(hit)
  })
  return { header: headerBox, container: containerBox, headerOnTop }
}

/** The nearest ancestor of `element` that scrolls vertically, marked so a locator can find it. */
export async function scrollContainerOf(page: Page, element: Locator): Promise<Locator | null> {
  const found = await element.evaluate((start) => {
    for (let node = start.parentElement; node; node = node.parentElement) {
      const overflowY = getComputedStyle(node).overflowY
      if (/(auto|scroll)/.test(overflowY) && node.scrollHeight > node.clientHeight + 1) {
        node.setAttribute('data-e2e-scroll-container', '')
        return true
      }
    }
    return false
  })
  return found ? page.locator('[data-e2e-scroll-container]').first() : null
}
