import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, test } from '../fixtures/pp365'
import {
  addProject,
  firstRowTitle,
  openAdministration,
  removeButton,
  rowOf
} from '../fixtures/program-administration'

/**
 * The program administration's list of child projects: selecting and unselecting rows drives the
 * "Fjern underområder" button, a removed project does not haunt the selection, a collapsed and
 * reopened hub group keeps what was selected, and a removed project can be added back. The last
 * case writes to the program and undoes itself; if it fails half-way, the project is added back
 * in the clean-up.
 *
 * Needs E2E_PROGRAM_URL and a test user who may manage the program (the checkboxes are only
 * offered then); skips with a message otherwise.
 */
const programUrl = configuredUrl(process.env.E2E_PROGRAM_URL)
const hubUrl = baseURL.replace(/\/+$/, '').toLowerCase()
const pointsAtHub = !!programUrl && programUrl.toLowerCase() === hubUrl

test.describe('program administration', () => {
  test.skip(
    !programUrl,
    'E2E_PROGRAM_URL is not set (or is the .env.example placeholder); skipping'
  )
  test.skip(
    pointsAtHub,
    `E2E_PROGRAM_URL points at the hub (${programUrl}); set it to a program site`
  )

  test('selecting rows enables removal, unselecting them disables it', async ({
    page,
    openPage,
    resolvePage
  }) => {
    const admin = await openAdministration(page, programUrl!, openPage, resolvePage)
    const checkboxes = admin.getByRole('grid').first().getByRole('checkbox')
    test.skip(
      (await checkboxes.count()) === 0,
      'the test user may not manage the program, so there is no selection'
    )
    await expect(removeButton(admin)).toBeDisabled()
    // The first checkbox selects all; the second is the first row.
    await checkboxes.nth(1).click()
    await expect(removeButton(admin)).toBeEnabled()
    await checkboxes.nth(1).click()
    await expect(
      removeButton(admin),
      'nothing is selected, so nothing can be removed'
    ).toBeDisabled()
  })

  test('a collapsed and reopened hub group keeps its selection', async ({
    page,
    openPage,
    resolvePage
  }) => {
    const admin = await openAdministration(page, programUrl!, openPage, resolvePage)
    const groupHeaders = admin.locator('[class*="groupHeader"]')
    test.skip((await groupHeaders.count()) < 2, 'the program spans one hub, so there are no groups')
    const first = groupHeaders.first()
    // The group is the header's parent; its grid unmounts on collapse, and "the first grid in the
    // web part" would then be the next group's.
    const firstGroup = first.locator('..')
    const grid = firstGroup.getByRole('grid')
    test.skip(
      (await grid.getByRole('checkbox').count()) === 0,
      'the test user may not manage the program, so there is no selection'
    )
    await grid.getByRole('checkbox').nth(1).click()
    await expect(removeButton(admin)).toBeEnabled()
    await first.click()
    await expect(grid).toBeHidden()
    await first.click()
    await expect(
      firstGroup.getByRole('grid').getByRole('checkbox').nth(1),
      'the selection should survive the collapse'
    ).toBeChecked()
    await expect(removeButton(admin)).toBeEnabled()
  })

  test('a removed project can be added back, and does not linger in the selection', async ({
    page,
    openPage,
    resolvePage
  }) => {
    test.setTimeout(240_000)
    const admin = await openAdministration(page, programUrl!, openPage, resolvePage)
    const grid = admin.getByRole('grid').first()
    test.skip(
      (await grid.getByRole('checkbox').count()) === 0,
      'the test user may not manage the program, so there is no selection'
    )
    test.skip(
      (await grid.getByRole('row').count()) < 3,
      'the program needs at least two child projects for this flow'
    )
    const title = await firstRowTitle(grid)
    expect(title).toBeTruthy()

    let removed = false
    try {
      await grid.getByRole('row').nth(1).getByRole('checkbox').click()
      await expect(removeButton(admin)).toBeEnabled()
      await removeButton(admin).click()
      removed = true
      await expect(
        page.getByText(/underområder fjernet|child projects removed/i).first()
      ).toBeVisible({ timeout: 60_000 })
      await expect(rowOf(admin, title)).toBeHidden({ timeout: 60_000 })

      // The removed project must not linger in the selection: after removal, nothing is selected.
      await expect(removeButton(admin), 'nothing is selected after a removal').toBeDisabled()
      const remaining = admin.getByRole('grid').first().getByRole('checkbox')
      await remaining.nth(1).click()
      await remaining.nth(1).click()
      await expect(
        removeButton(admin),
        'selecting and unselecting another row leaves nothing selected'
      ).toBeDisabled()

      await addProject(page, admin, title)
      removed = false
    } finally {
      if (
        removed &&
        !(await rowOf(admin, title)
          .isVisible()
          .catch(() => false))
      ) {
        await addProject(page, admin, title)
      }
    }
  })
})
