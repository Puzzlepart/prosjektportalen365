import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, onListPage, test } from '../fixtures/pp365'
import {
  findDocumentLibrary,
  openDocumentTemplateDialog
} from '../fixtures/document-template-dialog'
import { deleteFile, filesWithPrefix } from '../fixtures/rest'

/**
 * A write flow on a project: a document template is copied into the project's library through
 * "Hent dokumentmal", renamed on the way so the copy can be told apart, and deleted again through
 * REST. Leftovers of an earlier run are deleted first.
 */
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const hubUrl = baseURL.replace(/\/+$/, '').toLowerCase()
const pointsAtHub = !!projectUrl && projectUrl.toLowerCase() === hubUrl
const COPY_PREFIX = 'E2E-kopi-'

async function deleteTestCopies(page: import('@playwright/test').Page, folder: string) {
  const files = await filesWithPrefix(page, projectUrl!, folder, COPY_PREFIX)
  for (const file of files) await deleteFile(page, projectUrl!, file.ServerRelativeUrl)
  return files.length
}

/** The file of this name in a folder of the project, if there is one. */
async function fileNamed(page: import('@playwright/test').Page, folder: string, fileName: string) {
  const files = await filesWithPrefix(page, projectUrl!, folder, fileName)
  return files.find((file) => file.Name.toLowerCase() === fileName.toLowerCase())
}

test.describe('document template copy', () => {
  test.skip(
    !projectUrl,
    'E2E_PROJECT_URL is not set (or is the .env.example placeholder); skipping'
  )
  test.skip(
    pointsAtHub,
    `E2E_PROJECT_URL points at the hub (${projectUrl}); set it to a project site`
  )

  test('a template is copied into the library under a new name, and removed again', async ({
    page,
    consoleGuard
  }) => {
    void consoleGuard
    // With room for a second load of the library, when SharePoint's React fault struck the first.
    test.setTimeout(300_000)
    const name = `${COPY_PREFIX}${Date.now().toString().slice(-6)}`
    const libraryPage = await findDocumentLibrary(page, projectUrl!)
    const folder = new URL(libraryPage).pathname.replace(/\/Forms\/AllItems\.aspx$/i, '')
    await deleteTestCopies(page, decodeURIComponent(folder))

    // The template's own name, when it was free before the copy. A copy under it is then this
    // run's, made because the copy started before the new name was applied, and the clean-up
    // removes it: left behind, it makes the next run find the name taken (run 40313190157).
    let ownName: string | undefined
    try {
      const dialog = await onListPage(page, libraryPage, () => openDocumentTemplateDialog(page))
      // A file, not a folder: a folder's name is a v8 Link without an href, which is a button that
      // enters the folder, so a file row is one without a button.
      const fileRow = dialog
        .locator('.fui-DataGridBody [role="row"]')
        .filter({ hasNot: page.getByRole('button') })
        .first()
      await expect(fileRow).toBeVisible({ timeout: 30_000 })
      await fileRow.getByRole('checkbox').click()
      await dialog.getByRole('button', { name: /^velg$|^select$/i }).click()
      // The library root is the target when no folder is chosen.
      await dialog.getByRole('button', { name: /kopier hit|copy here/i }).click()
      // Each item starts closed, and opens by itself once the library says its name is taken; a
      // click on an open item closes it. So click only while it is closed, and look again until
      // the field shows: a click that met the item opening by itself closed it (run 40313190157).
      // The inputs carry placeholders, not linked labels.
      const header = dialog.locator('button[aria-expanded]').first()
      const fileName = dialog.getByPlaceholder(/^filnavn$|^file name$/i).first()
      await expect(async () => {
        if ((await header.getAttribute('aria-expanded')) === 'false') await header.click()
        await expect(fileName).toBeVisible({ timeout: 2_000 })
      }).toPass({ timeout: 30_000 })
      const templateName = (await header.innerText()).trim()
      await fileName.fill(name)
      // The new name is applied 400 ms after the last keystroke, once the library has confirmed
      // it is free; starting the copy before that would copy under the template's own name.
      await page.waitForTimeout(1500)
      const start = dialog.getByRole('button', { name: /start kopiering|start copy/i })
      await expect(start).toBeEnabled({ timeout: 15_000 })
      if (!(await fileNamed(page, decodeURIComponent(folder), templateName))) ownName = templateName
      await start.click()
      // The summary's "Lukk" ends the copy. The title's X is named "Lukk" too and is always there,
      // so the footer's button is found by its text, which the X (an icon) has not.
      const close = dialog.getByRole('button').filter({ hasText: /^\s*(lukk|close)\s*$/i })
      await expect(close).toBeVisible({ timeout: 120_000 })
      const copies = await filesWithPrefix(page, projectUrl!, decodeURIComponent(folder), name)
      expect(
        copies.map((f) => f.Name),
        'the copy should be in the library under its new name'
      ).toHaveLength(1)
      await close.click()
    } finally {
      await deleteTestCopies(page, decodeURIComponent(folder))
      const ownNameCopy = ownName && (await fileNamed(page, decodeURIComponent(folder), ownName))
      if (ownNameCopy) await deleteFile(page, projectUrl!, ownNameCopy.ServerRelativeUrl)
    }
    expect(
      await filesWithPrefix(page, projectUrl!, decodeURIComponent(folder), name),
      'the copy should be gone after the clean-up'
    ).toHaveLength(0)
  })
})
