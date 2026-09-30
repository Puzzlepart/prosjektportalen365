import { expect } from '@playwright/test'
import { baseURL } from '../../playwright.config'
import { webPart } from './pp365'

/**
 * Adding a column to the portfolio overview: the columns list, the test columns' clean-up, the
 * form's inputs (whose labels are not linked) and the header list, shared by the deployed and the
 * local-bundle flow.
 */
const hub = baseURL.replace(/\/+$/, '')
export const COLUMN_PREFIX = 'E2E kolonne'
/** The hub's project columns list, whatever the installation language named it. */
export async function findColumnsList(page: import('@playwright/test').Page) {
  const response = await page.request.get(
    // The configuration lists are hidden, so no filter on Hidden here.
    `${hub}/_api/web/lists?$select=Title,Id&$top=500`,
    { headers: { Accept: 'application/json;odata=nometadata' } }
  )
  const lists = ((await response.json()) as { value: { Title: string; Id: string }[] }).value
  const list = lists.find((l) => /^(prosjektkolonner|project columns)$/i.test(l.Title))
  if (!list)
    throw new Error(`No project columns list among: ${lists.map((l) => l.Title).join(', ')}`)
  return list
}

/** The columns whose title starts with the prefix, as SharePoint has them. */
export async function findTestColumns(page: import('@playwright/test').Page) {
  const list = await findColumnsList(page)
  const items = await page.request.get(
    `${hub}/_api/web/lists(guid'${list.Id}')/items?$select=Id,Title,GtShowFieldPortfolio&$filter=startswith(Title,'${COLUMN_PREFIX}')`,
    { headers: { Accept: 'application/json;odata=nometadata' } }
  )
  return (
    (await items.json()) as {
      value: { Id: number; Title: string; GtShowFieldPortfolio: boolean }[]
    }
  ).value
}

/** Deletes every column whose title starts with the prefix, through the REST API. */
export async function deleteTestColumns(page: import('@playwright/test').Page) {
  const list = await findColumnsList(page)
  const items = await page.request.get(
    `${hub}/_api/web/lists(guid'${list.Id}')/items?$select=Id,Title&$filter=startswith(Title,'${COLUMN_PREFIX}')`,
    { headers: { Accept: 'application/json;odata=nometadata' } }
  )
  const rows = ((await items.json()) as { value: { Id: number; Title: string }[] }).value
  if (rows.length === 0) return 0
  const digest = await page.request.post(`${hub}/_api/contextinfo`, {
    headers: { Accept: 'application/json;odata=nometadata' }
  })
  const formDigest = ((await digest.json()) as { FormDigestValue: string }).FormDigestValue
  for (const row of rows) {
    const deleted = await page.request.post(
      `${hub}/_api/web/lists(guid'${list.Id}')/items(${row.Id})`,
      {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'X-RequestDigest': formDigest,
          'X-HTTP-Method': 'DELETE',
          'IF-MATCH': '*'
        }
      }
    )
    if (!deleted.ok())
      throw new Error(`Could not delete column ${row.Title} (${row.Id}): HTTP ${deleted.status()}`)
  }
  return rows.length
}

/**
 * The input of a form field, by its label. The panel's labels are drawn with an icon and are not
 * linked to their inputs, so the field's container is found by the label text and the input in it.
 */
export function fieldInput(panel: import('@playwright/test').Locator, label: RegExp) {
  const field = panel
    .locator('[class*="fui-Field"]')
    .filter({ has: panel.page().getByText(label) })
    .first()
  return field.getByRole('textbox').or(field.getByRole('spinbutton')).first()
}

/**
 * The overview's column headers, in order, without the "add column" header the list ends with and
 * without the blank selection header. Waits until the list has settled: "Tittel" is always there.
 */
export async function columnHeaders(page: import('@playwright/test').Page) {
  const overview = webPart(page, /porteføljeoversikt|portfolio overview/i).first()
  await expect(overview.getByRole('columnheader', { name: /^tittel$|^title$/i })).toBeVisible({
    timeout: 60_000
  })
  const headers = await overview.getByRole('columnheader').allInnerTexts()
  return headers.map((h) => h.trim()).filter((h) => h && !/legg til kolonne|add column/i.test(h))
}
