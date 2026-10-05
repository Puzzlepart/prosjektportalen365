import { expect, Locator, Page } from '@playwright/test'
import { baseURL } from '../../playwright.config'
import { deleteItem, currentUserId, restGet, siteId } from './rest'

/**
 * The project status page's report commands, and the clean-up of the drafts a flow creates: the
 * reports live in the hub's "Prosjektstatus" list, keyed by the project's site id.
 */
const hub = baseURL.replace(/\/+$/, '')

export const newReportButton = (webPart: Locator) =>
  webPart.getByRole('button', { name: /^opprett$|^create$/i }).first()
export const deleteReportButton = (webPart: Locator) =>
  webPart.getByRole('button', { name: /^slett$|^delete$/i }).first()

/** The hub's status list, whatever the installation language named it. */
async function statusListTitle(page: Page) {
  const response = await restGet(page, `${hub}/_api/web/lists?$select=Title&$top=500`)
  const titles = ((await response.json()) as { value: { Title: string }[] }).value.map(
    (l) => l.Title
  )
  const title = titles.find((t) => /^(prosjektstatus|project status)$/i.test(t))
  if (!title) throw new Error(`No status list among: ${titles.join(', ')}`)
  return title
}

interface DraftReport {
  Id: number
  GtModerationStatus: string
  Created: string
  AuthorId: number
}

/** The project's unpublished reports, whoever wrote them: any one of them keeps "Opprett" disabled. */
export async function draftReports(page: Page, projectUrl: string): Promise<DraftReport[]> {
  const [list, site] = await Promise.all([statusListTitle(page), siteId(page, projectUrl)])
  const response = await restGet(
    page,
    `${hub}/_api/web/lists/getbytitle('${list}')/items?$select=Id,GtModerationStatus,Created,AuthorId&$filter=GtSiteId eq '${site}'&$orderby=Created desc&$top=500`
  )
  if (!response.ok())
    throw new Error(
      `Could not list the reports of ${projectUrl}: HTTP ${response.status()} ${await response.text()}`
    )
  const items = ((await response.json()) as { value: DraftReport[] }).value
  return items.filter((i) => !/publisert|published/i.test(i.GtModerationStatus ?? ''))
}

/**
 * Deletes the signed-in user's unpublished reports for the project created since `since`, through
 * REST. Used before a flow (leftovers of a run that failed) and after it. Older drafts of the
 * user's own stay: outside the window they are not the flow's leftovers.
 */
export async function deleteOwnDraftReports(page: Page, projectUrl: string, since: Date) {
  const [list, me, drafts] = await Promise.all([
    statusListTitle(page),
    currentUserId(page, hub),
    draftReports(page, projectUrl)
  ])
  const own = drafts.filter((d) => d.AuthorId === me && new Date(d.Created) >= since)
  for (const draft of own) await deleteItem(page, hub, list, draft.Id)
  return own.length
}

/**
 * The drafts that keep "Opprett" disabled, described for a skip message: which items, their
 * state and date, and whose they are. Undefined when there is none, so a disabled "Opprett" means
 * the user lacks the project's admin permission.
 */
export async function describeBlockingDrafts(page: Page, projectUrl: string) {
  const [me, drafts] = await Promise.all([currentUserId(page, hub), draftReports(page, projectUrl)])
  if (drafts.length === 0) return undefined
  return drafts
    .map(
      (d) =>
        `item ${d.Id} (${d.GtModerationStatus}, ${d.Created.slice(0, 10)}, ${
          d.AuthorId === me
            ? "the test user's own, older than the clean-up window"
            : `user ${d.AuthorId}`
        })`
    )
    .join(', ')
}

/** The status web part, mounted with its toolbar. */
export async function statusWebPart(page: Page) {
  const webPart = page.locator('[data-sp-web-part-id]').first()
  await expect(webPart).toBeVisible({ timeout: 60_000 })
  await expect(webPart.getByRole('button').first()).toBeVisible({ timeout: 60_000 })
  return webPart
}
