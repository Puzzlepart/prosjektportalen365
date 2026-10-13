import { expect, Locator, Page, test } from '@playwright/test'
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
export const snapshotButton = (webPart: Locator) =>
  webPart.getByRole('button', { name: /^åpne øyeblikksbilde$|^open as snapshot$/i }).first()

/** The title of one of the hub's lists, whatever the installation language named it. */
async function hubListTitle(page: Page, pattern: RegExp, what: string) {
  const response = await restGet(page, `${hub}/_api/web/lists?$select=Title&$top=500`)
  const titles = ((await response.json()) as { value: { Title: string }[] }).value.map(
    (l) => l.Title
  )
  const title = titles.find((t) => pattern.test(t))
  if (!title) throw new Error(`No ${what} among: ${titles.join(', ')}`)
  return title
}

/** The hub's status list. */
const statusListTitle = (page: Page) =>
  hubListTitle(page, /^(prosjektstatus|project status)$/i, 'status list')

/** The hub's library of status report attachments, with a folder per report named by its id. */
const attachmentsLibraryTitle = (page: Page) =>
  hubListTitle(page, /^(prosjektstatusvedlegg|projectstatusattachments)$/i, 'attachments library')

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

interface PublishedSnapshot {
  /** The report's id in the hub's status list */
  reportId: number
  /** Server-relative path of the report's snapshot image */
  snapshotPath: string
}

/**
 * The project's published reports that have a snapshot, newest first. Publishing uploads
 * `Snapshot.png` to the report's folder in the hub's attachments library, not as a list item
 * attachment. Publishing cannot be undone from the page, so no flow publishes: the snapshot flows
 * read one that is there, and skip when none is.
 */
export async function publishedSnapshots(
  page: Page,
  projectUrl: string
): Promise<PublishedSnapshot[]> {
  const [list, library, site] = await Promise.all([
    statusListTitle(page),
    attachmentsLibraryTitle(page),
    siteId(page, projectUrl)
  ])
  const [reports, files] = await Promise.all([
    restGet(
      page,
      `${hub}/_api/web/lists/getbytitle('${list}')/items?$select=Id,GtModerationStatus&$filter=GtSiteId eq '${site}'&$orderby=Created desc&$top=500`
    ),
    restGet(
      page,
      `${hub}/_api/web/lists/getbytitle('${library}')/items?$select=FileLeafRef,FileDirRef,FileRef&$filter=FSObjType eq 0&$top=5000`
    )
  ])
  for (const [response, what] of [
    [reports, `the reports of ${projectUrl}`],
    [files, 'the status report attachments']
  ] as const) {
    if (!response.ok())
      throw new Error(`Could not list ${what}: HTTP ${response.status()} ${await response.text()}`)
  }
  const snapshotByReport = new Map<string, string>()
  for (const file of (
    (await files.json()) as {
      value: { FileLeafRef: string; FileDirRef: string; FileRef: string }[]
    }
  ).value) {
    if (/^snapshot\.png$/i.test(file.FileLeafRef)) {
      snapshotByReport.set(file.FileDirRef.split('/').pop()!, file.FileRef)
    }
  }
  return ((await reports.json()) as { value: { Id: number; GtModerationStatus: string }[] }).value
    .filter((i) => /publisert|published/i.test(i.GtModerationStatus ?? ''))
    .map((i) => ({ reportId: i.Id, snapshotPath: snapshotByReport.get(String(i.Id)) }))
    .filter((s): s is PublishedSnapshot => !!s.snapshotPath)
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

const SNAPSHOT_DIALOG = /^(øyeblikksbilde|snapshot) –/i
const CLOSE = /^(lukk|close)$/i

/**
 * The snapshot of a published report, read-only: `Åpne øyeblikksbilde` opens it in a dialog that
 * fills the window and shows the image; the dialog goes to full screen where the browser allows
 * it; `Kopier lenke` copies a link to the status page with the snapshot shown and offers it and
 * the image file's link; the image file opens in a new tab; and the copied link opens the status
 * page with the dialog already open. Shared by the flow against the deployed build and its
 * local-bundle twin, which differ only in how a page is opened.
 *
 * @param page The page
 * @param snapshot A published report with a snapshot
 * @param pagePath The status page's path
 * @param open Opens a page path, query string included, the way the spec loads pages
 */
export async function snapshotJourney(
  page: Page,
  snapshot: PublishedSnapshot,
  pagePath: string,
  open: (path: string) => Promise<void>
) {
  const { reportId, snapshotPath } = snapshot
  const imagePath = new URL(snapshotPath, baseURL).pathname.toLowerCase()
  await open(`${pagePath}?selectedReport=${reportId}`)
  const button = snapshotButton(await statusWebPart(page))
  await expect(button).toBeEnabled({ timeout: 60_000 })
  await button.click()

  const dialog = page.getByRole('dialog', { name: SNAPSHOT_DIALOG })
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  const image = dialog.getByRole('img')
  expect(new URL((await image.getAttribute('src'))!, baseURL).pathname.toLowerCase()).toBe(
    imagePath
  )
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), {
      message: 'the snapshot image loads',
      timeout: 30_000
    })
    .toBe(true)

  // Full screen is the browser's to grant: a host that refuses it hides the button, and a headless
  // browser may ignore the request. When it is granted, the link is copied in full screen, where
  // the copy dialog must be shown and reachable too, and full screen is left after.
  const enterFullscreen = dialog.getByRole('button', { name: /^(fullskjerm|full screen)$/i })
  const exitFullscreen = dialog.getByRole('button', {
    name: /^(avslutt fullskjerm|exit full screen)$/i
  })
  let inFullscreen = false
  if (await enterFullscreen.isVisible()) {
    await enterFullscreen.click()
    // `isVisible` returns at once whatever its timeout says; `waitFor` waits.
    inFullscreen = await exitFullscreen.waitFor({ state: 'visible', timeout: 5_000 }).then(
      () => true,
      () => false
    )
    if (!inFullscreen) {
      test.info().annotations.push({
        type: 'note',
        description: 'the browser did not enter full screen; the button was offered and clicked'
      })
    }
  }

  // The copied link, and the two links on offer.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await dialog.getByRole('button', { name: /^(kopier lenke|copy link)$/i }).click()
  const copyDialog = page.getByRole('dialog', {
    name: /kopier lenke til øyeblikksbilde|copy link to snapshot/i
  })
  await expect(copyDialog).toBeVisible()
  await expect(
    copyDialog.getByText(/lenken er kopiert|the link has been copied/i),
    'the link reached the clipboard'
  ).toBeVisible()
  const pageLink = await copyDialog
    .getByLabel(/lenke til øyeblikksbildet på statussiden|link to the snapshot on the status page/i)
    .inputValue()
  expect(pageLink).toContain(`selectedReport=${reportId}`)
  expect(pageLink).toContain('snapshot=1')
  expect(
    await copyDialog
      .getByLabel(/direkte lenke til bildefilen|direct link to the image file/i)
      .inputValue()
  ).toBe(new URL(snapshotPath, baseURL).href)
  await copyDialog.getByRole('button', { name: CLOSE }).click()
  await expect(copyDialog).toBeHidden()
  if (inFullscreen) {
    await exitFullscreen.click()
    await expect(enterFullscreen).toBeVisible()
  }

  // The image file in a new tab, out of reach of SharePoint's own link handling. The tab is opened
  // with `noopener`, so it is awaited on the context, not as the page's popup.
  const newTab = page.context().waitForEvent('page')
  await dialog
    .getByRole('button', { name: /åpne bildefilen i ny fane|open image file in new tab/i })
    .click()
  const tab = await newTab
  await tab.waitForURL(/snapshot\.png/i, { timeout: 30_000 })
  expect(new URL(tab.url()).pathname.toLowerCase()).toBe(imagePath)
  await tab.close()

  await dialog.getByRole('button', { name: CLOSE }).click()
  await expect(dialog).toBeHidden()

  // The copied link opens the page with the snapshot shown, and Escape closes it.
  await open(pageLink)
  await expect(page.getByRole('dialog', { name: SNAPSHOT_DIALOG })).toBeVisible({
    timeout: 60_000
  })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: SNAPSHOT_DIALOG })).toBeHidden()
}
