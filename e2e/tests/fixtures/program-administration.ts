import { expect, Locator, Page } from '@playwright/test'
import { webPart } from './pp365'

/**
 * The program administration's list: opening it, its buttons and rows, and adding a project back
 * through the dialog, shared by the deployed and the local-bundle flow.
 */
const PAGES = ['Admin.aspx', 'Programadministrasjon.aspx', 'ProgramAdministration.aspx']

/** The administration web part, mounted and past its loading state. */
export async function openAdministration(
  page: Page,
  programUrl: string,
  openPage: (path: string) => Promise<void>,
  resolvePage: (site: string, candidates: string[]) => Promise<string>
) {
  await openPage(await resolvePage(programUrl, PAGES))
  return administrationWebPart(page)
}

/** The administration web part on an already opened page, with its grid visible. */
export async function administrationWebPart(page: Page) {
  const admin = webPart(page, /administrasjon av underområder|program administration/i).first()
  await expect(admin).toBeVisible({ timeout: 60_000 })
  await expect(admin.getByRole('grid').first()).toBeVisible({ timeout: 60_000 })
  return admin
}

export const removeButton = (admin: Locator) =>
  admin.getByRole('button', { name: /fjern underområder|remove child/i }).first()
export const addButton = (admin: Locator) =>
  admin.getByRole('button', { name: /legg til underområder|add child/i }).first()

/**
 * A project row's check, as opposed to a hub group's ("Velg alle i ...") and the select-all
 * ("Velg alle rader"): the lists are the portfolio overview's grid (`ListGrid`).
 */
export const ROW_CHECK = /^(velg rad|select row)$/i

/** The checks of the project rows in `container`, in display order. */
export const rowChecks = (container: Locator) =>
  container.getByRole('checkbox', { name: ROW_CHECK })

/** The buttons that open and close the hub groups of a grid (only when the projects span hubs). */
export const groupButtons = (grid: Locator) => grid.locator('button[aria-expanded]')

/** The row of a project, by its title. */
export const rowOf = (admin: Locator, title: string) =>
  admin.getByRole('row').filter({ hasText: title }).first()

/** The check of a project's row, by its title. */
export const rowCheckOf = (admin: Locator, title: string) =>
  rowOf(admin, title).getByRole('checkbox', { name: ROW_CHECK })

/** The title of the first project row: its link text, or the first line of the row. */
export async function firstRowTitle(grid: Locator) {
  // Group rows and the header row hold no project row check.
  const firstRow = grid
    .getByRole('row')
    .filter({ has: grid.page().getByRole('checkbox', { name: ROW_CHECK }) })
    .first()
  const link = await firstRow
    .getByRole('link')
    .first()
    .innerText()
    .catch(() => '')
  return link || (await firstRow.innerText()).split('\n').filter(Boolean)[0]
}

/** Adds a project back through the dialog. Used by the clean-up as well as the flow. */
export async function addProject(page: Page, admin: Locator, title: string) {
  await addButton(admin).click()
  const dialog = page.getByRole('dialog').last()
  // The dialog's groups may all be collapsed, so the search box is what proves it is ready.
  const search = dialog
    .getByRole('searchbox')
    .or(dialog.getByPlaceholder(/søk|search/i))
    .first()
  await expect(search).toBeVisible({ timeout: 60_000 })
  await search.fill(title)
  const row = dialog.getByRole('row').filter({ hasText: title }).first()
  // The projects are grouped per hub. Groups open while a search is active, but one the user
  // closed stays closed, so a closed group that hides the row is opened here.
  if (!(await row.isVisible({ timeout: 5000 }).catch(() => false))) {
    for (const group of await dialog.locator('button[aria-expanded="false"]').all()) {
      if (await row.isVisible().catch(() => false)) break
      await group.click()
    }
  }
  await expect(row).toBeVisible({ timeout: 30_000 })
  await row.getByRole('checkbox', { name: ROW_CHECK }).click()
  const add = dialog.getByRole('button', { name: /^legg til$|^add$/i })
  await expect(add).toBeEnabled()
  await add.click()
  await expect(dialog).toBeHidden({ timeout: 60_000 })
  await expect(rowOf(admin, title)).toBeVisible({ timeout: 60_000 })
}
