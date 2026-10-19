import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, test } from '../fixtures/pp365'
import { restGet, siteId } from '../fixtures/rest'
import { statusListTitle, statusWebPart } from '../fixtures/status-report'

/**
 * Read-only, from a browser in Los Angeles: the status page shows its dates as the site shows
 * them. A date-only field is stored as midnight in the site's time zone, which read in the
 * browser's zone is the day before anywhere west of the site, and a time read there is hours
 * off, so the report selector, the report menu and the project information sections showed a
 * report published at 09:30 as published at 00:30, or the day before. The library formats in the
 * site's time zone now, from the page context SPFx carries, which only a browser in another zone
 * shows. The expected texts are SharePoint's own (`FieldValuesAsText`), written in the site's
 * time zone and regional format, read through REST from the hub's status list.
 */
test.use({ timezoneId: 'America/Los_Angeles' })

const hub = baseURL.replace(/\/+$/, '')
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const PUBLISHED = /publisert|published/i

interface DateField {
  InternalName: string
  Title: string
  /** 0 is a date only, 1 a date and time */
  DisplayFormat: number
}

interface Report {
  Id: number
  GtModerationStatus: string
  FieldValuesAsText: Record<string, string>
}

/** The numbers in a date's text: "03.04.2026 09:30" gives 3, 4, 2026, 9, 30; "fredag 3. apr. 2026, 09:30" gives 3, 2026, 9, 30. */
const numbers = (text: string) => (text.match(/\d+/g) ?? []).map((n) => parseInt(n, 10))

/** The day, year, hour and minute of SharePoint's text, with the day first in the regional format. */
function dayYearTime(text: string): number[] {
  const [day, , year, hour, minute] = numbers(text)
  return [day, year, hour, minute].filter((n) => n !== undefined)
}

test('the status page shows its dates as the site shows them from a browser west of the site', async ({
  page,
  openPage,
  resolvePage
}) => {
  test.skip(!projectUrl, 'E2E_PROJECT_URL is not set (or is the .env.example placeholder)')
  // Norwegian texts: the day first in SharePoint's text, a 24-hour clock in the page's.
  const regional = await restGet(page, `${projectUrl}/_api/web/RegionalSettings?$select=LocaleId`)
  const { LocaleId } = (await regional.json()) as { LocaleId: number }
  test.skip(LocaleId !== 1044, `the project's regional format is LCID ${LocaleId}, not Norwegian`)

  // The status list's date fields, and the project's reports with SharePoint's text of each.
  const [list, site] = await Promise.all([statusListTitle(page), siteId(page, projectUrl!)])
  const fieldsResponse = await restGet(
    page,
    `${hub}/_api/web/lists/getbytitle('${list}')/fields?$select=InternalName,Title,DisplayFormat&$filter=TypeAsString eq 'DateTime' and Hidden eq false`
  )
  const fields = ((await fieldsResponse.json()) as { value: DateField[] }).value
  const texts = ['Modified', ...fields.map((f) => f.InternalName)]
    .map((name) => `FieldValuesAsText/${name}`)
    .join(',')
  const reportsResponse = await restGet(
    page,
    `${hub}/_api/web/lists/getbytitle('${list}')/items?$select=Id,GtModerationStatus,${texts}&$expand=FieldValuesAsText&$filter=GtSiteId eq '${site}'&$orderby=Created desc&$top=50`
  )
  if (!reportsResponse.ok())
    throw new Error(`Could not list the reports: HTTP ${reportsResponse.status()}`)
  const reports = ((await reportsResponse.json()) as { value: Report[] }).value
  test.skip(reports.length === 0, 'the project has no status reports')
  // What the page writes for a report: its published time, else when it was last changed.
  const reportDate = (report: Report) =>
    (PUBLISHED.test(report.GtModerationStatus ?? '') &&
      report.FieldValuesAsText.GtLastReportDate) ||
    report.FieldValuesAsText.Modified
  const report = reports.find((r) => PUBLISHED.test(r.GtModerationStatus ?? '')) ?? reports[0]

  await openPage(
    `${await resolvePage(projectUrl!, ['Prosjektstatus.aspx', 'ProjectStatus.aspx'])}?selectedReport=${report.Id}`
  )
  const webPart = await statusWebPart(page)
  const language = await page.evaluate(() => document.documentElement.lang || 'nb-NO')
  test.skip(!/^nb|^no/i.test(language), `the site's language is ${language}, not Norwegian`)

  // The report selector names the report by its date: the day the site shows.
  const selector = webPart
    .getByRole('button')
    .filter({ hasText: new RegExp(`\\b${numbers(reportDate(report))[2]}\\b`) })
    .first()
  await expect(selector).toBeVisible({ timeout: 30_000 })
  const selectorText = (await selector.innerText()).trim()
  expect(
    reports.map((r) => dayYearTime(reportDate(r)).slice(0, 2)),
    `the selector reads "${selectorText}" in Los Angeles; the reports are ${reports.map(reportDate).join(', ')}`
  ).toContainEqual(numbers(selectorText).slice(0, 2))

  // The report menu lists every report with its time, which Los Angeles read seven to nine hours
  // off. The menu is disabled with a single report.
  if (await selector.isEnabled()) {
    await selector.click()
    const items = page.getByRole('menuitemcheckbox')
    await expect(items.first()).toBeVisible({ timeout: 10_000 })
    const shown = (await items.allInnerTexts()).map((t) => numbers(t.trim()))
    const expected = reports.map((r) => dayYearTime(reportDate(r)))
    for (const item of shown) {
      expect(expected, `the menu lists ${JSON.stringify(item)} in Los Angeles`).toContainEqual(item)
    }
    await page.keyboard.press('Escape')
  }

  // A date-only field of the report in a project information section: stored as the site's
  // midnight, it read as the day before in Los Angeles.
  let checked = 0
  for (const field of fields.filter((f) => f.DisplayFormat === 0)) {
    const stored = report.FieldValuesAsText[field.InternalName]
    if (!stored) continue
    const value = webPart
      .locator('[class*="statusSectionField"]')
      .filter({ has: page.locator('[class*="label"]', { hasText: field.Title }) })
      .locator('[class*="value"]')
      .first()
    if ((await value.count()) === 0) continue
    const shownValue = (await value.innerText()).trim()
    expect(
      numbers(shownValue),
      `${field.Title} reads "${shownValue}" in Los Angeles, SharePoint "${stored}"`
    ).toEqual(numbers(stored))
    checked++
  }
  test.info().annotations.push({
    type: 'date-only fields checked',
    description: `${checked} of ${fields.filter((f) => f.DisplayFormat === 0).length} in the status list`
  })
})
