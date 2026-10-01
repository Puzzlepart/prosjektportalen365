import { expect, Locator, Page } from '@playwright/test'
import { baseURL } from '../../playwright.config'
import { deleteItem, currentUserId, siteId } from './rest'

/**
 * The project status page's report commands, and the clean-up of the drafts a flow creates: the
 * reports live in the hub's "Prosjektstatus" list, keyed by the project's site id.
 */
const hub = baseURL.replace(/\/+$/, '')
const JSON_HEADERS = { Accept: 'application/json;odata=nometadata' }

export const newReportButton = (webPart: Locator) =>
  webPart.getByRole('button', { name: /^opprett$|^create$/i }).first()
export const deleteReportButton = (webPart: Locator) =>
  webPart.getByRole('button', { name: /^slett$|^delete$/i }).first()

/** The hub's status list, whatever the installation language named it. */
async function statusListTitle(page: Page) {
  const response = await page.request.get(`${hub}/_api/web/lists?$select=Title&$top=500`, {
    headers: JSON_HEADERS
  })
  const titles = ((await response.json()) as { value: { Title: string }[] }).value.map(
    (l) => l.Title
  )
  const title = titles.find((t) => /^(prosjektstatus|project status)$/i.test(t))
  if (!title) throw new Error(`No status list among: ${titles.join(', ')}`)
  return title
}

/**
 * Deletes the signed-in user's unpublished reports for the project created since `since`, through
 * REST. Used before a flow (leftovers of a run that failed) and after it.
 */
export async function deleteOwnDraftReports(page: Page, projectUrl: string, since: Date) {
  const list = await statusListTitle(page)
  const [me, site] = await Promise.all([currentUserId(page, hub), siteId(page, projectUrl)])
  const response = await page.request.get(
    `${hub}/_api/web/lists/getbytitle('${list}')/items?$select=Id,Title,GtModerationStatus,Created&$filter=GtSiteId eq '${site}' and AuthorId eq ${me} and Created ge datetime'${since.toISOString()}'&$top=50`,
    { headers: JSON_HEADERS }
  )
  if (!response.ok())
    throw new Error(
      `Could not list the reports of ${projectUrl}: HTTP ${response.status()} ${await response.text()}`
    )
  const items = (
    (await response.json()) as {
      value: { Id: number; Title: string; GtModerationStatus: string }[]
    }
  ).value
  const drafts = items.filter((i) => !/publisert|published/i.test(i.GtModerationStatus ?? ''))
  for (const draft of drafts) await deleteItem(page, hub, list, draft.Id)
  return drafts.length
}

/** The status web part, mounted with its toolbar. */
export async function statusWebPart(page: Page) {
  const webPart = page.locator('[data-sp-web-part-id]').first()
  await expect(webPart).toBeVisible({ timeout: 60_000 })
  await expect(webPart.getByRole('button').first()).toBeVisible({ timeout: 60_000 })
  return webPart
}
