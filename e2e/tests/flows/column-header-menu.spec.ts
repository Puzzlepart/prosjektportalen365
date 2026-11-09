import { baseURL } from '../../playwright.config'
import { expect, test, webPart } from '../fixtures/pp365'

/**
 * Read-only: a right click on a column header of the portfolio overview opens the column menu,
 * as a click does. The hub's grid sends a right click to the menu only when its owner asks for
 * it (the program administration does not, so there it is the browser's), which this pins for the
 * hub.
 */
const hub = baseURL.replace(/\/+$/, '')

test('portfolio overview: a right click on a column header opens the column menu', async ({
  page,
  openPage,
  resolvePage
}) => {
  await openPage(
    await resolvePage(
      hub,
      [process.env.E2E_PAGE_OVERVIEW, 'Porteføljeoversikt.aspx', 'PortfolioOverview.aspx'].filter(
        Boolean
      ) as string[]
    )
  )
  const overview = webPart(page, /porteføljeoversikt|portfolio overview/i).first()
  // The first named column header; the selection column's is nameless.
  const header = overview.getByRole('columnheader').filter({ hasText: /\S/ }).first()
  await expect(header).toBeVisible({ timeout: 90_000 })
  await header.click({ button: 'right' })
  const menu = page.getByRole('menu').first()
  await expect(menu, 'the column menu opens').toBeVisible({ timeout: 10_000 })
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
})
