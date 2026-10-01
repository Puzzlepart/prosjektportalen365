import {
  COLUMN_PREFIX,
  columnHeaders,
  deleteTestColumns,
  fieldInput,
  findTestColumns,
  clearPersistedColumns
} from '../fixtures/portfolio-overview-column'
import { baseURL } from '../../playwright.config'
import { expect, test, webPart } from '../fixtures/pp365'

/**
 * A write flow on the hub: a site admin adds a column to the portfolio overview's current view,
 * and the column keeps its place after a reload. Pins the defect where a new column sorted first
 * after a reload because the view's own column order did not know it. The column is removed again
 * through the REST API at the end, and any leftover from an earlier run at the start.
 *
 * Needs the test user to be a site admin of the hub, since "Legg til kolonne" is only offered to
 * admins; skips with a message otherwise.
 */
const hub = baseURL.replace(/\/+$/, '')

test.describe('portfolio overview, adding a column', () => {
  test('a new column keeps its place at the end after a reload', async ({
    page,
    openPage,
    resolvePage
  }, testInfo) => {
    test.setTimeout(240_000)
    const stamp = Date.now().toString().slice(-6)
    const columnName = `${COLUMN_PREFIX} ${stamp}`
    const internalName = `E2EKolonne${stamp}`
    await openPage(
      await resolvePage(
        hub,
        [process.env.E2E_PAGE_OVERVIEW, 'Porteføljeoversikt.aspx', 'PortfolioOverview.aspx'].filter(
          Boolean
        ) as string[]
      )
    )
    await deleteTestColumns(page)

    const overview = webPart(page, /porteføljeoversikt|portfolio overview/i).first()
    // "Legg til kolonne" is the list's last column header; clicking it opens a menu with the
    // command of the same name. Only site admins get the header.
    const addColumnHeader = overview
      .getByRole('columnheader', { name: /legg til kolonne|add column/i })
      .first()
    await expect(overview.getByRole('columnheader').first()).toBeVisible({ timeout: 60_000 })
    test.skip(
      !(await addColumnHeader.isVisible().catch(() => false)),
      'the test user is not a site admin, so "Legg til kolonne" is not offered'
    )
    const before = await columnHeaders(page)

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
      // The search property field is a plain input, or a suggestion box once the managed
      // properties have loaded; either takes the typed value, the latter after a pick.
      await fieldInput(panel, /^søkeegenskap|^search property/i).fill(internalName)
      await fieldInput(panel, /^sorteringsrekkefølge|^sort order/i).fill('999')
      // Visible in the portfolio: the form starts with no visibility, and a column without it is
      // filtered out of the view on the next load, by design. The field is a multiselect combobox.
      const visibility = panel
        .locator('[class*="fui-Field"]')
        .filter({ has: page.getByText(/synlighet for kolonne|column visibility/i) })
        .first()
        .getByRole('combobox')
      await visibility.click()
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
      // The build under test may close the panel on a failed save; the list item tells the truth.
      const saved = await findTestColumns(page)
      expect(
        saved.map((c) => c.Title),
        'the column should exist in the columns list'
      ).toContain(columnName)
      expect(
        saved.find((c) => c.Title === columnName)?.GtShowFieldPortfolio,
        'the column should be visible in the portfolio'
      ).toBe(true)
      // What the view knows after the save: its column ids and its own column order. Attached, so
      // a column that does not come back after the reload can be told from one the view never got.
      const views = await page.request.get(
        `${hub}/_api/web/lists/getbytitle('Porteføljevisninger')/items?$select=Id,Title,GtIsDefaultView,GtPortfolioColumnOrder,GtPortfolioColumns/Id&$expand=GtPortfolioColumns&$top=20`,
        { headers: { Accept: 'application/json;odata=nometadata' } }
      )
      const viewsBody = views.ok()
        ? await views.json()
        : { status: views.status(), text: await views.text() }
      await testInfo.attach('views-after-save.json', {
        body: JSON.stringify({ saved, views: viewsBody }, null, 2),
        contentType: 'application/json'
      })
      console.log('views after save:', JSON.stringify(viewsBody).slice(0, 1200))

      await expect(overview.getByRole('columnheader', { name: columnName })).toBeVisible({
        timeout: 30_000
      })
      const afterSave = await columnHeaders(page)
      expect(afterSave, 'the new column should be last right after saving').toEqual([
        ...before,
        columnName
      ])

      await clearPersistedColumns(page)
      await clearPersistedColumns(page)
      await page.reload()
      await expect(overview.getByRole('columnheader').first()).toBeVisible({ timeout: 60_000 })
      await expect(overview.getByRole('columnheader', { name: columnName })).toBeVisible({
        timeout: 60_000
      })
      const afterReload = await columnHeaders(page)
      expect(afterReload, 'the new column should still be last after a reload').toEqual([
        ...before,
        columnName
      ])
    } finally {
      await deleteTestColumns(page)
    }

    await clearPersistedColumns(page)
    await page.reload()
    await expect(overview.getByRole('columnheader').first()).toBeVisible({ timeout: 60_000 })
    expect(await columnHeaders(page), 'the column should be gone after the clean-up').toEqual(
      before
    )
  })
})
