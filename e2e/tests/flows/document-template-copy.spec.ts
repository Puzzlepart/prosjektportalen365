import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, test } from '../fixtures/pp365'
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
    test.setTimeout(240_000)
    const name = `${COPY_PREFIX}${Date.now().toString().slice(-6)}`
    const libraryPage = await findDocumentLibrary(page, projectUrl!)
    const folder = new URL(libraryPage).pathname.replace(/\/Forms\/AllItems\.aspx$/i, '')
    await page.goto(libraryPage, { timeout: 90_000 })
    await deleteTestCopies(page, decodeURIComponent(folder))

    try {
      const dialog = await openDocumentTemplateDialog(page)
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
      // Each item is collapsed until its header is clicked; its inputs carry placeholders, not
      // linked labels.
      const fileName = dialog.getByPlaceholder(/^filnavn$|^file name$/i).first()
      if (!(await fileName.isVisible().catch(() => false))) {
        await dialog.locator('[class*="chevronIcon"]').first().click()
      }
      await expect(fileName).toBeVisible({ timeout: 30_000 })
      await fileName.fill(name)
      // The new name is applied 400 ms after the last keystroke, once the library has confirmed
      // it is free; starting the copy before that would copy under the template's own name.
      await page.waitForTimeout(1500)
      const start = dialog.getByRole('button', { name: /start kopiering|start copy/i })
      await expect(start).toBeEnabled({ timeout: 15_000 })
      await start.click()
      await expect(dialog.getByRole('button', { name: /^lukk$|^close$/i })).toBeVisible({
        timeout: 120_000
      })
      const copies = await filesWithPrefix(page, projectUrl!, decodeURIComponent(folder), name)
      expect(
        copies.map((f) => f.Name),
        'the copy should be in the library under its new name'
      ).toHaveLength(1)
      await dialog.getByRole('button', { name: /^lukk$|^close$/i }).click()
    } finally {
      await deleteTestCopies(page, decodeURIComponent(folder))
    }
    expect(
      await filesWithPrefix(page, projectUrl!, decodeURIComponent(folder), name),
      'the copy should be gone after the clean-up'
    ).toHaveLength(0)
  })
})
