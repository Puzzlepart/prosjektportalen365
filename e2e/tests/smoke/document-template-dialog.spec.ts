import {
  expectDialogGridsToFit,
  findDocumentLibrary,
  measureBothScreens,
  openDocumentTemplateDialog,
  openTargetFolderScreen
} from '../fixtures/document-template-dialog'
import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, test } from '../fixtures/pp365'

/**
 * The "Hent dokumentmal" dialog's lists must fit the dialog: no horizontal scrollbar on the
 * template selection screen or on the target folder screen. Pins the regression where the shared
 * grid overrode Fluent's allowance for the selection cell, so the target folder list was 44px
 * wider than the dialog's content. Read only: a template is selected and the target screen
 * opened, and the dialog is dismissed before anything is copied.
 */
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
      await page.goto(await findDocumentLibrary(page, projectUrl!))
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
    await page.goto(await findDocumentLibrary(page, projectUrl!))
    const dialog = await openDocumentTemplateDialog(page)
    await openTargetFolderScreen(dialog)
    const rows = dialog.locator('.fui-DataGridBody [role="row"]')
    test.skip(
      (await rows.count()) === 0,
      'the library has no subfolders, so there is nothing to choose'
    )
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
  })
})
