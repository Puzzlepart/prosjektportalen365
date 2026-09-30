import { expect } from '@playwright/test'

/**
 * The project timeline list: how it is measured and what both the deployed and the local-bundle
 * tests assert about it.
 */
/** Widths of the list, its container and its columns, read from the rendered grid. */
export async function measureTimelineList(page: import('@playwright/test').Page) {
  const list = page.locator('[class*="timelineList"]').first()
  await expect(list).toBeVisible({ timeout: 60_000 })
  await expect(list.locator('.fui-DataGrid').first()).toBeVisible({ timeout: 60_000 })
  // Let the container measurement and Fluent's auto-fit settle.
  await page.waitForTimeout(3000)
  return list.evaluate((root) => {
    const q = (selector: string) => root.querySelector(selector) as HTMLElement | null
    const box = (el: HTMLElement | null) =>
      el
        ? {
            clientWidth: el.clientWidth,
            scrollWidth: el.scrollWidth,
            overflowX: getComputedStyle(el).overflowX
          }
        : null
    const gridEl = q('.fui-DataGrid')
    const headerCells = Array.from(root.querySelectorAll('.fui-DataGridHeaderCell')).map(
      (cell) => ({
        text: (cell.textContent || '').trim().slice(0, 24),
        width: Math.round((cell as HTMLElement).getBoundingClientRect().width)
      })
    )
    const selectionCell = q('.fui-DataGridSelectionCell')
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scrollContainer: box(q('[class*="scrollContainer"]')),
      gridContainer: box(gridEl?.parentElement ?? null),
      grid: box(gridEl),
      selectionCellWidth: selectionCell
        ? Math.round(selectionCell.getBoundingClientRect().width)
        : 0,
      headerCells,
      headerCellsTotal: headerCells.reduce((sum, cell) => sum + cell.width, 0)
    }
  })
}

/** The assertions both the deployed and the local-bundle variant make on the measurements. */
export function expectListToFitContainer(metrics: Awaited<ReturnType<typeof measureTimelineList>>) {
  const container = metrics.gridContainer!
  expect(
    container.scrollWidth,
    'the grid should not be wider than its container'
  ).toBeLessThanOrEqual(container.clientWidth)
  // The fit shares the whole width; Fluent's auto-fit gives the rounding remainder to the last column.
  expect(
    metrics.headerCellsTotal + metrics.selectionCellWidth,
    'the columns should share the whole container width'
  ).toBeGreaterThanOrEqual(container.clientWidth - 2)
}
