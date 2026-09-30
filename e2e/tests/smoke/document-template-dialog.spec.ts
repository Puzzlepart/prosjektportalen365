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

/** The site's document library ("Dokumenter" when there is one), by REST, so its URL need not be guessed. */
export async function findDocumentLibrary(page: import('@playwright/test').Page, siteUrl: string) {
  const response = await page.request.get(
    `${siteUrl}/_api/web/lists?$filter=BaseTemplate eq 101 and Hidden eq false&$select=Title,RootFolder/ServerRelativeUrl&$expand=RootFolder&$top=10`,
    { headers: { Accept: 'application/json;odata=nometadata' } }
  )
  if (!response.ok())
    throw new Error(`Could not list the libraries of ${siteUrl}: HTTP ${response.status()}`)
  const libraries = (
    (await response.json()) as {
      value: { Title: string; RootFolder: { ServerRelativeUrl: string } }[]
    }
  ).value
  const library = libraries.find((l) => /dokument/i.test(l.Title)) ?? libraries[0]
  if (!library) throw new Error(`${siteUrl} has no document library`)
  return `${new URL(siteUrl).origin}${library.RootFolder.ServerRelativeUrl}/Forms/AllItems.aspx`
}

/** Runs the command from the library's command bar, or from its "Mer" overflow when the bar is narrow. */
export async function openDocumentTemplateDialog(page: import('@playwright/test').Page) {
  await expect(
    page.locator('[data-automationid="CommandBar"], [role="menubar"]').first()
  ).toBeVisible({
    timeout: 60_000
  })
  let command = page
    .getByRole('menuitem', { name: /hent dokumentmal/i })
    .or(page.getByRole('button', { name: /hent dokumentmal/i }))
    .first()
  if (!(await command.isVisible().catch(() => false))) {
    await page
      .getByRole('menuitem', { name: /^mer$|^more$/i })
      .first()
      .click()
    command = page.getByRole('menuitem', { name: /hent dokumentmal/i }).first()
  }
  await expect(command, 'the "Hent dokumentmal" command should be in the command bar').toBeVisible({
    timeout: 30_000
  })
  await command.click()
  const dialog = page.locator('[role="dialog"]').last()
  await expect(dialog.locator('.fui-DataGrid').first()).toBeVisible({ timeout: 60_000 })
  return dialog
}

/** Widths of every grid in the dialog against its scrolling container. */
export async function measureDialogGrids(dialog: import('@playwright/test').Locator) {
  return dialog.evaluate((root) => {
    const box = (el: Element | null) =>
      el
        ? {
            clientWidth: (el as HTMLElement).clientWidth,
            scrollWidth: (el as HTMLElement).scrollWidth,
            overflowX: getComputedStyle(el).overflowX
          }
        : null
    return Array.from(root.querySelectorAll('.fui-DataGrid')).map((grid) => ({
      grid: box(grid),
      container: box(grid.parentElement),
      selectionCellWidth: grid.querySelector('.fui-DataGridSelectionCell')
        ? Math.round(
            grid.querySelector('.fui-DataGridSelectionCell')!.getBoundingClientRect().width
          )
        : 0,
      headerCells: Array.from(grid.querySelectorAll('.fui-DataGridHeaderCell')).map((cell) => ({
        text: (cell.textContent || '').trim().slice(0, 20),
        width: Math.round(cell.getBoundingClientRect().width)
      }))
    }))
  })
}

/** Picks the first template and goes on to the target folder screen. */
export async function openTargetFolderScreen(dialog: import('@playwright/test').Locator) {
  await dialog.locator('.fui-DataGridBody .fui-DataGridSelectionCell').first().click()
  await dialog.getByRole('button', { name: /^velg$|^select$/i }).click()
  await expect(dialog.getByRole('button', { name: /kopier hit|copy here/i })).toBeVisible({
    timeout: 60_000
  })
}

/** Measures the selection screen, then the target folder screen (when the library has subfolders). */
export async function measureBothScreens(
  page: import('@playwright/test').Page,
  dialog: import('@playwright/test').Locator,
  testInfo: import('@playwright/test').TestInfo
) {
  await page.waitForTimeout(2000)
  const selectScreen = await measureDialogGrids(dialog)
  await openTargetFolderScreen(dialog)
  await page.waitForTimeout(2000)
  const targetScreen =
    (await dialog.locator('.fui-DataGrid').count()) > 0 ? await measureDialogGrids(dialog) : []
  await page.keyboard.press('Escape')
  const metrics = { selectScreen, targetScreen }
  await testInfo.attach('metrics.json', {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json'
  })
  return metrics
}

/** The assertion both the deployed and the local-bundle variant make. */
export function expectDialogGridsToFit(metrics: Awaited<ReturnType<typeof measureBothScreens>>) {
  for (const entry of [...metrics.selectScreen, ...metrics.targetScreen]) {
    expect(
      entry.container!.scrollWidth,
      'a dialog grid should not be wider than its container'
    ).toBeLessThanOrEqual(entry.container!.clientWidth)
  }
}

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
