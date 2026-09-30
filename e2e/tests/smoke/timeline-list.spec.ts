import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, test } from '../fixtures/pp365'

/**
 * The project timeline's list must fit the web part: the grid no wider than its container (no
 * horizontal scrollbar) and its columns sharing the container's width, as the v8 justified layout
 * did. Two regressions are pinned here: the shared grid once overrode Fluent's allowance for the
 * selection cell, which pushed every row 44px past the container whatever the columns did, and
 * the fit once ignored Fluent's per-column padding, which squeezed the last columns to their floor.
 * Measured at two widths, because both defects scaled with the container.
 */
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const hubUrl = baseURL.replace(/\/+$/, '').toLowerCase()
const pointsAtHub = !!projectUrl && projectUrl.toLowerCase() === hubUrl

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

test.describe('project timeline list', () => {
  test.skip(
    !projectUrl,
    'E2E_PROJECT_URL is not set (or is the .env.example placeholder); skipping'
  )
  test.skip(
    pointsAtHub,
    `E2E_PROJECT_URL points at the hub (${projectUrl}); set it to a provisioned project site`
  )

  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 1920, height: 1080 }
  ]) {
    test(`fits the web part at ${viewport.width}px`, async ({
      page,
      openPage,
      resolvePage
    }, testInfo) => {
      await page.setViewportSize(viewport)
      await openPage(
        await resolvePage(projectUrl!, [
          'Prosjekttidslinje.aspx',
          'ProjectTimeline.aspx',
          'Tidslinje.aspx'
        ])
      )
      const metrics = await measureTimelineList(page)
      await testInfo.attach('metrics.json', {
        body: JSON.stringify(metrics, null, 2),
        contentType: 'application/json'
      })
      expectListToFitContainer(metrics)
    })
  }
})
