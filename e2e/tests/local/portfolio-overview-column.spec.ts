import { baseURL } from '../../playwright.config'
import { expect, test, webPart } from '../fixtures/pp365'
import { localBundleUse, localBundles, openWithLocalBundle } from '../fixtures/local-bundle'
import {
  COLUMN_PREFIX,
  columnHeaders,
  deleteTestColumns,
  fieldInput,
  clearPersistedColumns
} from '../fixtures/portfolio-overview-column'

/**
 * The "add a column" flow with the *local* PortfolioWebParts bundle loaded onto the hub's overview
 * page through SPFx's debug manifests. Opt in with E2E_LOCAL_BUNDLE=1 while `npx heft start
 * --nobrowser` serves PortfolioWebParts on https://localhost:4321, built with the channel's ids.
 */
const hub = baseURL.replace(/\/+$/, '')

test.use(localBundleUse)

test('local: a new column keeps its place at the end after a reload', async ({
  page,
  resolvePage
}) => {
  test.setTimeout(240_000)
  const stamp = Date.now().toString().slice(-6)
  const columnName = `${COLUMN_PREFIX} ${stamp}`
  const internalName = `E2EKolonne${stamp}`
  const pagePath = await resolvePage(hub, ['Porteføljeoversikt.aspx', 'PortfolioOverview.aspx'])
  await openWithLocalBundle(page, pagePath)
  await deleteTestColumns(page)
  const overview = webPart(page, /porteføljeoversikt|portfolio overview/i).first()
  const addColumnHeader = overview
    .getByRole('columnheader', { name: /legg til kolonne|add column/i })
    .first()
  const before = await columnHeaders(page)
  expect(
    (await localBundles(page)).length,
    'the local bundle should be the one loaded'
  ).toBeGreaterThan(0)
  test.skip(
    !(await addColumnHeader.isVisible().catch(() => false)),
    'the test user is not a site admin'
  )
  try {
    await addColumnHeader.click()
    await page
      .getByRole('menuitem', { name: /legg til kolonne|add column/i })
      .first()
      .click()
    const panel = page
      .getByRole('dialog')
      .filter({ hasText: /ny kolonne|new column/i })
      .first()
    await expect(panel).toBeVisible({ timeout: 30_000 })
    await fieldInput(panel, /^visningsnavn|^display name/i).fill(columnName)
    await fieldInput(panel, /^internt feltnavn|^internal (field )?name/i).fill(internalName)
    await fieldInput(panel, /^søkeegenskap|^search property/i).fill(internalName)
    await fieldInput(panel, /^sorteringsrekkefølge|^sort order/i).fill('999')
    // Visible in the portfolio, or the view filters the column out on the next load.
    await panel
      .locator('[class*="fui-Field"]')
      .filter({ has: page.getByText(/synlighet for kolonne|column visibility/i) })
      .first()
      .getByRole('combobox')
      .click()
    await page
      .getByRole('menuitemcheckbox', { name: /portefølje|portfolio/i })
      .or(page.getByRole('option', { name: /portefølje|portfolio/i }))
      .first()
      .click()
    await page.keyboard.press('Escape')
    const save = panel.getByRole('button', { name: /^lagre$|^save$/i })
    await expect(save).toBeEnabled({ timeout: 10_000 })
    await save.click()
    await expect(panel).toBeHidden({ timeout: 30_000 })
    await expect(overview.getByRole('columnheader', { name: columnName })).toBeVisible({
      timeout: 30_000
    })
    expect(await columnHeaders(page), 'last right after saving').toEqual([...before, columnName])
    await clearPersistedColumns(page)
    await openWithLocalBundle(page, pagePath)
    await expect(overview.getByRole('columnheader', { name: columnName })).toBeVisible({
      timeout: 60_000
    })
    expect(await columnHeaders(page), 'still last after a reload').toEqual([...before, columnName])
  } finally {
    await deleteTestColumns(page)
  }
})
