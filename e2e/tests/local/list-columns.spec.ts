import { Page } from '@playwright/test'
import { baseURL } from '../../playwright.config'
import {
  expectKeyboardResize,
  expectTagsFollowTheColumn,
  expectTitleAtDefaultWidth,
  overviewGrid
} from '../fixtures/list-columns'
import { localBundleUse, localBundles, openWithLocalBundle } from '../fixtures/local-bundle'
import { columnHeaders } from '../fixtures/portfolio-overview-column'
import { expect, test } from '../fixtures/pp365'

/**
 * Read-only checks of the portfolio overview's columns with the local PortfolioWebParts bundle,
 * the same as `tests/flows/list-columns.spec.ts` runs against the deployed one.
 */
const hub = baseURL.replace(/\/+$/, '')
const PAGES = ['Porteføljeoversikt.aspx', 'PortfolioOverview.aspx']

test.use(localBundleUse)

/** Opens the overview with the local bundle, and waits for its data. */
async function openOverview(page: Page, pagePath: string) {
  await openWithLocalBundle(page, pagePath)
  await columnHeaders(page)
  expect(
    (await localBundles(page)).some((url) => url.includes('/dist/portfolio-overview-web-part')),
    'the page loaded the overview from the local bundle'
  ).toBe(true)
}

test('local: the tags a column put behind +n come back as it widens', async ({
  page,
  resolvePage
}) => {
  test.setTimeout(180_000)
  await openOverview(page, await resolvePage(hub, PAGES))
  const skip = await expectTagsFollowTheColumn(overviewGrid(page))
  test.skip(!!skip, skip)
})

test('local: a column starts at its default width from the project columns list', async ({
  page,
  resolvePage
}) => {
  test.setTimeout(120_000)
  await openOverview(page, await resolvePage(hub, PAGES))
  const skip = await expectTitleAtDefaultWidth(overviewGrid(page))
  test.skip(!!skip, skip)
})

test("local: a column's width can be changed from the keyboard (WCAG 2.1.1)", async ({
  page,
  resolvePage
}) => {
  test.setTimeout(120_000)
  await openOverview(page, await resolvePage(hub, PAGES))
  await expectKeyboardResize(overviewGrid(page))
})
