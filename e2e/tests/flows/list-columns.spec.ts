import { baseURL } from '../../playwright.config'
import {
  expectTagsFollowTheColumn,
  expectTitleAtDefaultWidth,
  overviewGrid
} from '../fixtures/list-columns'
import { columnHeaders } from '../fixtures/portfolio-overview-column'
import { test } from '../fixtures/pp365'

/**
 * Read-only: the portfolio overview's columns. A column's width is the grid's own state, gone on
 * the next load, so nothing is restored.
 */
const hub = baseURL.replace(/\/+$/, '')
const PAGES = ['Porteføljeoversikt.aspx', 'PortfolioOverview.aspx']

test.describe("the portfolio overview's columns", () => {
  test('a column starts at its default width from the project columns list', async ({
    page,
    openPage,
    resolvePage
  }) => {
    test.setTimeout(120_000)
    await openPage(await resolvePage(hub, PAGES))
    await columnHeaders(page)
    const skip = await expectTitleAtDefaultWidth(overviewGrid(page))
    test.skip(!!skip, skip)
  })

  test('the tags a column put behind +n come back as it widens, and go again as it narrows', async ({
    page,
    openPage,
    resolvePage
  }) => {
    test.setTimeout(180_000)
    await openPage(await resolvePage(hub, PAGES))
    await columnHeaders(page)
    const skip = await expectTagsFollowTheColumn(overviewGrid(page))
    test.skip(!!skip, skip)
  })
})
