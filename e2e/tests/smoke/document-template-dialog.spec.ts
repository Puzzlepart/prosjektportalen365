import {
  documentLibrary,
  expectDialogGridsToFit,
  findDocumentLibrary,
  measureBothScreens,
  openDocumentTemplateDialog,
  openTargetFolderScreen
} from '../fixtures/document-template-dialog'
import { deleteFolder, ensureFolder } from '../fixtures/rest'
import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, test } from '../fixtures/pp365'

/**
 * The "Hent dokumentmal" dialog's lists must fit the dialog: no horizontal scrollbar on the
 * template selection screen or on the target folder screen. Pins the regression where the shared
 * grid overrode Fluent's allowance for the selection cell, so the target folder list was 44px
 * wider than the dialog's content. A template is selected and the target screen opened, and the
 * dialog is dismissed before anything is copied; the third test adds a folder of its own to a
 * library without one, and removes it again.
 */
const FOLDER = 'E2E-mappe'
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const hubUrl = baseURL.replace(/\/+$/, '').toLowerCase()
const pointsAtHub = !!projectUrl && projectUrl.toLowerCase() === hubUrl

test.describe('document template dialog', () => {
  test.skip(
    !projectUrl,
    'E2E_PROJECT_URL is not set (or is the .env.example placeholder); skipping'
  )
  test.skip(
    pointsAtHub,
    `E2E_PROJECT_URL points at the hub (${projectUrl}); set it to a provisioned project site`
  )

  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 1600, height: 1000 }
  ]) {
    test(`lists fit the dialog at ${viewport.width}px`, async ({
      page,
      consoleGuard
    }, testInfo) => {
      void consoleGuard
      await page.setViewportSize(viewport)
      // A library view is not an SPFx web part page, so the canvas wait of `openPage` does not apply.
      // A library view is heavy; the CI runner has timed out on its default 30 s once.
      await page.goto(await findDocumentLibrary(page, projectUrl!), { timeout: 90_000 })
      const dialog = await openDocumentTemplateDialog(page)
      expectDialogGridsToFit(await measureBothScreens(page, dialog, testInfo))
    })
  }

  test('a chosen target folder can be unchosen by clicking it again', async ({
    page,
    consoleGuard
  }) => {
    void consoleGuard
    await page.setViewportSize({ width: 1600, height: 1000 })
    const library = await documentLibrary(page, projectUrl!)
    // The target folder screen lists the library's subfolders; a library without one gets a
    // folder of the test's own for the duration of the test.
    const created = await ensureFolder(page, projectUrl!, library.serverRelativeUrl, FOLDER)
    try {
      await page.goto(library.url, { timeout: 90_000 })
      const dialog = await openDocumentTemplateDialog(page)
      await openTargetFolderScreen(dialog)
      const rows = dialog.locator('.fui-DataGridBody [role="row"]')
      await expect(rows.first()).toBeVisible({ timeout: 30_000 })
      // The last cell of the row, not the name: the name enters the folder.
      const row = rows.first()
      await row.locator('.fui-DataGridCell').last().click()
      await expect(row).toHaveAttribute('aria-selected', 'true')
      await row.locator('.fui-DataGridCell').last().click()
      await expect(row, 'a second click should clear the choice').toHaveAttribute(
        'aria-selected',
        'false'
      )
      await page.keyboard.press('Escape')
    } finally {
      if (created) await deleteFolder(page, projectUrl!, `${library.serverRelativeUrl}/${FOLDER}`)
    }
  })
})
