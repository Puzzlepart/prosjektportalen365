import { configuredUrl, expect, test, webPartByAlias } from '../fixtures/pp365'

/**
 * The week numbers the date picker shows in a real browser, read-only: `Rediger
 * prosjektinformasjon` is opened, a date in January 2027 is typed into the first date field, the
 * calendar is opened and its week column read, and the panel is closed without saving. January
 * 2027 tells the week rules apart: 1 January is a Friday, so by ISO 8601 (Norway's rule) the week
 * of 28 December 2026 is week 53 and week 1 starts on Monday 4 January, while the rule that
 * numbers from the week holding 1 January shows 1. Chromium 146 dropped `minimalDays` from
 * `Intl.Locale`'s week info, which is what made the picker fall back to the latter on Norwegian
 * sites; only a browser shows it.
 */
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)

test('the date picker numbers the weeks by ISO 8601 on a Norwegian site', async ({
  page,
  openPage,
  resolvePage
}) => {
  test.skip(!projectUrl, 'E2E_PROJECT_URL is not set (or is the .env.example placeholder)')
  await openPage(await resolvePage(projectUrl!, ['ProjectHome.aspx', 'Hjem.aspx', 'Home.aspx']))
  const info = webPartByAlias(page, 'ProjectInformation').first()
  await expect(info).toBeVisible({ timeout: 60_000 })
  await info
    .getByRole('button', { name: /^Rediger/ })
    .first()
    .click()
  const panel = page.getByRole('dialog').last()
  const close = panel.getByRole('button', { name: /^lukk$|^close$/i }).last()
  await expect(close).toBeVisible({ timeout: 30_000 })

  // The first date field: Fluent's picker is an input with a calendar icon after it.
  const dateInput = panel.locator('.fui-Input:has(.fui-Input__contentAfter) input').first()
  await expect(dateInput).toBeVisible({ timeout: 30_000 })
  const language = await page.evaluate(() => document.documentElement.lang || 'nb-NO')
  test.skip(!/^nb|^no/i.test(language), `the site's language is ${language}, not Norwegian`)
  await dateInput.fill('15.01.2027')
  await dateInput.press('Tab')
  await panel
    .locator('.fui-Input:has(.fui-Input__contentAfter)')
    .first()
    .locator('.fui-Input__contentAfter')
    .click()
  const weekCells = page.locator('.fui-CalendarDayGrid__weekNumberCell')
  await expect(weekCells.first()).toBeVisible({ timeout: 10_000 })
  await expect(
    page.locator('.fui-CalendarDay__monthAndYear').first(),
    'the calendar shows January 2027'
  ).toHaveText(/januar 2027/i)
  // The column's first cell is the empty corner above the numbers.
  const weeks = (await weekCells.allTextContents()).map((t) => t.trim()).filter(Boolean)
  expect(weeks.slice(0, 5)).toEqual(['53', '1', '2', '3', '4'])

  await page.keyboard.press('Escape')
  await close.click()
  await expect(panel).toBeHidden({ timeout: 10_000 })
})
