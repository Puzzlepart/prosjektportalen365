import { baseURL } from '../../playwright.config'
import { configuredUrl, expect, test } from '../fixtures/pp365'
import {
  addProject,
  firstRowTitle,
  groupButtons,
  openAdministration,
  removeButton,
  rowCheckOf,
  rowChecks,
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
    const checkboxes = rowChecks(admin.getByRole('grid').first())
    test.skip(
      (await checkboxes.count()) === 0,
      'the test user may not manage the program, so there is no selection'
    )
    await expect(removeButton(admin)).toBeDisabled()
    await checkboxes.first().click()
    await expect(removeButton(admin)).toBeEnabled()
    await checkboxes.first().click()
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
    const grid = admin.getByRole('grid').first()
    const groups = groupButtons(grid)
    test.skip((await groups.count()) < 2, 'the program spans one hub, so there are no groups')
    test.skip(
      (await rowChecks(grid).count()) === 0,
      'the test user may not manage the program, so there is no selection'
    )
    // The page opens every group, so the first project row is the first group's.
    const title = await firstRowTitle(grid)
    await rowCheckOf(admin, title).click()
    await expect(removeButton(admin)).toBeEnabled()
    await groups.first().click()
    await expect(rowOf(admin, title)).toBeHidden()
    await groups.first().click()
    await expect(
      rowCheckOf(admin, title),
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
      (await rowChecks(grid).count()) === 0,
      'the test user may not manage the program, so there is no selection'
    )
    test.skip(
      (await rowChecks(grid).count()) < 2,
      'the program needs at least two child projects for this flow'
    )
    const title = await firstRowTitle(grid)
    expect(title).toBeTruthy()

    let removed = false
    try {
      await rowCheckOf(admin, title).click()
      await expect(removeButton(admin)).toBeEnabled()
      await removeButton(admin).click()
      removed = true
      await expect(
        page.getByText(/underområder fjernet|child projects removed/i).first()
      ).toBeVisible({ timeout: 60_000 })
      await expect(rowOf(admin, title)).toBeHidden({ timeout: 60_000 })

      // The removed project must not linger in the selection: after removal, nothing is selected.
      await expect(removeButton(admin), 'nothing is selected after a removal').toBeDisabled()
      const remaining = rowChecks(admin.getByRole('grid').first())
      await remaining.first().click()
      await remaining.first().click()
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
