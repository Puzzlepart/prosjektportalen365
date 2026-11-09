import { baseURL } from '../../playwright.config'
import { scanAccessibility, SURFACES } from '../fixtures/a11y'
import { addButton, openAdministration } from '../fixtures/program-administration'
import {
  expectListTypography,
  measureListTypography,
  scrollContainerOf,
  scrollUnderHeader
} from '../fixtures/lists'
import { configuredUrl, expect, test, WEB_PART } from '../fixtures/pp365'

/**
 * Read-only: the lists look alike and keep their column headers in view. Every list has the
 * typography of 1.14's v8 lists (column names 14px semibold, values 12px in the lighter grey,
 * links at the values' size): the hub's grid inherited 14px from its provider, `DataGridList`
 * set its column names at 12px and the dynamic list its values in a dark grey until phase 5. The
 * program administration's column headers stick to the page as it scrolls, and to the top of the
 * add dialog's list as its rows scroll; on the page the list once scrolled its own rows, which
 * left its headers pinned to a box that never scrolled.
 */
const hub = baseURL.replace(/\/+$/, '')
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const programUrl = configuredUrl(process.env.E2E_PROGRAM_URL)

const LISTS = [
  {
    name: 'portfolio overview',
    site: () => hub,
    pages: ['Porteføljeoversikt.aspx', 'PortfolioOverview.aspx']
  },
  {
    name: 'aggregated overview',
    site: () => hub,
    pages: ['Leveranseoversikt.aspx', 'DeliveryOverview.aspx', 'Nytteoversikt.aspx']
  },
  // Not provisioned by the templates: a page on the test hub, or E2E_PAGE_DYNAMIC_LIST.
  {
    name: 'dynamic list',
    site: () => hub,
    pages: [process.env.E2E_PAGE_DYNAMIC_LIST, 'DynList.aspx'].filter(Boolean) as string[]
  },
  {
    name: "project timeline's list",
    site: () => projectUrl,
    pages: ['Prosjekttidslinje.aspx', 'ProjectTimeline.aspx', 'Tidslinje.aspx']
  }
]

test.describe('list typography', () => {
  for (const list of LISTS) {
    test(`the ${list.name} has the lists' typography`, async ({
      page,
      openPage,
      resolvePage
    }, testInfo) => {
      test.setTimeout(180_000)
      const site = list.site()
      test.skip(!site, `the site of the ${list.name} is not configured`)
      await openPage(await resolvePage(site!, list.pages))
      // The first table with rows: the list (a page may hold other web parts, and a list's
      // toolbar or filter panel renders no table).
      const table = page
        .locator(`${WEB_PART} .fui-Table`)
        .filter({ has: page.locator('.fui-TableBody .fui-TableCell') })
        .first()
      const typography = await measureListTypography(table)
      await testInfo.attach('typography.json', {
        body: JSON.stringify(typography, null, 2),
        contentType: 'application/json'
      })
      expectListTypography(typography)
    })
  }
})

/**
 * The toolbar over the hub's lists keeps to one line: its search box is the part that gives way as
 * the window narrows, and nothing wraps until the window is under 480 px, where the buttons would
 * otherwise go past the edge (WCAG 1.4.10). A wrap at every width slipped in once (2026-10-20).
 */
// The search box is the toolbar's flexible part: it gives way as the window narrows, and nothing
// wraps until even a narrowed search box leaves the buttons no room (under 480 px).
test.describe('toolbar of the hub lists', () => {
  for (const list of LISTS.slice(0, 3)) {
    test(`the ${list.name}'s toolbar stays on one line, its search box giving way`, async ({
      page,
      openPage,
      resolvePage
    }) => {
      test.setTimeout(180_000)
      await openPage(await resolvePage(list.site()!, list.pages))
      const toolbar = page.locator(`${WEB_PART} .fui-FluentProvider:has(> .fui-Toolbar)`).first()
      await expect(toolbar.locator('.fui-Toolbar button').first()).toBeVisible({
        timeout: 60_000
      })
      let previousSearchWidth = Infinity
      for (const width of [1440, 1024, 768]) {
        await page.setViewportSize({ width, height: 900 })
        await page.waitForTimeout(1_000)
        const layout = await toolbar.evaluate((root) => {
          // Not Tabster's focus guards: 1 px `i` elements fixed at the page's top left.
          const items = Array.from(
            root.querySelectorAll('.fui-Toolbar > :not([data-tabster-dummy])')
          )
            .map((item) => item.getBoundingClientRect())
            .filter((box) => box.width > 0 && box.height > 0)
          const search = root.querySelector('.fui-SearchBox')
          return {
            height: Math.round(root.getBoundingClientRect().height),
            tops: items.map((box) => Math.round(box.top + box.height / 2)),
            searchWidth: search ? Math.round(search.getBoundingClientRect().width) : null
          }
        })
        expect(layout.height, `the toolbar is one line high at ${width}px`).toBeLessThanOrEqual(56)
        expect(
          Math.max(...layout.tops) - Math.min(...layout.tops),
          `the toolbar's items share one line at ${width}px`
        ).toBeLessThanOrEqual(8)
        if (layout.searchWidth !== null) {
          expect(
            layout.searchWidth,
            `the search box gives way as the window narrows to ${width}px`
          ).toBeLessThanOrEqual(previousSearchWidth)
          previousSearchWidth = layout.searchWidth
        }
      }
      await page.setViewportSize({ width: 320, height: 900 })
      await page.waitForTimeout(1_000)
      const outside = await toolbar.evaluate((root) => {
        const edge = root.closest('[data-sp-web-part-id]')!.getBoundingClientRect().right
        return Array.from(root.querySelectorAll('.fui-Toolbar button, .fui-SearchBox'))
          .filter((control) => control.getBoundingClientRect().right > edge + 1)
          .map((control) => control.getAttribute('aria-label') || control.textContent)
      })
      expect(outside, 'at 320px the toolbar wraps rather than go past the web part').toEqual([])
    })
  }
})

test.describe('program administration column headers', () => {
  test.skip(
    !programUrl,
    'E2E_PROGRAM_URL is not set (or is the .env.example placeholder); skipping'
  )

  test('stick to the top of the page as it scrolls', async ({ page, openPage, resolvePage }) => {
    // A short window, so that a program with a dozen projects scrolls.
    await page.setViewportSize({ width: 1280, height: 600 })
    const admin = await openAdministration(page, programUrl!, openPage, resolvePage)
    const grid = admin.getByRole('grid').first()
    const header = grid.locator('.fui-TableHeader').first()
    const region = page.locator('[data-automation-id="contentScrollRegion"]').first()
    const regionBox = (await region.boundingBox())!
    const headerBox = (await header.boundingBox())!
    const gridBox = (await grid.boundingBox())!
    // Scrolled 100px past the headers' own place, the rows still fill the window below them.
    const distance = headerBox.y - regionBox.y + 100
    const room = await region.evaluate((element) => element.scrollHeight - element.clientHeight)
    test.skip(
      room < distance || gridBox.y + gridBox.height - distance < regionBox.y + 200,
      'the program has too few projects for the page to scroll past its column headers'
    )
    const scrolled = await scrollUnderHeader(header, region, distance)
    expect(
      Math.abs(scrolled.header.y - scrolled.container.y),
      'the column headers sit at the top of the scrolled page'
    ).toBeLessThanOrEqual(2)
    expect(scrolled.headerOnTop, 'the column headers are drawn over the rows').toBe(true)
  })

  test('stay above the rows in the add dialog, under its search box', async ({
    page,
    openPage,
    resolvePage
  }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1280, height: 700 })
    const admin = await openAdministration(page, programUrl!, openPage, resolvePage)
    const add = addButton(admin)
    test.skip(!(await add.isVisible()), 'the test user may not manage the program')
    await add.click()
    const dialog = page.getByRole('dialog').last()
    const header = dialog.locator('.fui-TableHeader').first()
    await expect(header).toBeVisible({ timeout: 90_000 })
    await scanAccessibility(page, { component: 'AddProjectDialog', include: [SURFACES.dialog] })
    const search = dialog
      .getByRole('searchbox')
      .or(dialog.getByPlaceholder(/søk|search/i))
      .first()
    // The dialog groups the projects by hub and opens only the groups of fewer than ten: on the
    // test hub, 197 projects in two closed groups made a list two rows high, which never scrolled,
    // so the test skipped on every run. Opened as a user opens them, the list scrolls.
    const expandAll = dialog.getByRole('button', {
      name: /^(vis alle grupper|expand all groups)$/i
    })
    if (await expandAll.isVisible()) {
      await expandAll.click()
      await expect(
        dialog.getByRole('button', { name: /^(skjul alle grupper|collapse all groups)$/i })
      ).toBeVisible({ timeout: 10_000 })
    }
    const searchBefore = (await search.boundingBox())!
    const container = await scrollContainerOf(page, header)
    test.skip(!container, 'the dialog lists too few projects to scroll, even with its groups open')
    const scrolled = await scrollUnderHeader(header, container!, 400)
    expect(
      Math.abs(scrolled.header.y - scrolled.container.y),
      'the column headers sit at the top of the scrolled list'
    ).toBeLessThanOrEqual(2)
    expect(scrolled.headerOnTop, 'the column headers are drawn over the rows').toBe(true)
    expect((await search.boundingBox())!.y, 'the search box stays where it was').toBe(
      searchBefore.y
    )
    await dialog.getByRole('button', { name: /^avbryt$|^cancel$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 10_000 })
  })
})
