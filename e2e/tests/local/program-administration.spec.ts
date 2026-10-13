import { configuredUrl, expect, test } from '../fixtures/pp365'
import { localBundleUse, localBundles, openWithLocalBundle } from '../fixtures/local-bundle'
import {
  addProject,
  administrationWebPart,
  firstRowTitle,
  removeButton,
  rowCheckOf,
  rowChecks,
  rowOf
} from '../fixtures/program-administration'

/**
 * The program administration flow with the *local* ProgramWebParts bundle loaded onto the
 * program's administration page through SPFx's debug manifests. Opt in with E2E_LOCAL_BUNDLE=1
 * while `npx heft start --nobrowser` serves ProgramWebParts on https://localhost:4321, built with
 * the channel's ids.
 */
const programUrl = configuredUrl(process.env.E2E_PROGRAM_URL)

test.use(localBundleUse)

test('local: a removed project can be added back, and does not linger in the selection', async ({
  page,
  resolvePage
}) => {
  test.setTimeout(240_000)
  test.skip(!programUrl, 'E2E_PROGRAM_URL is not set')
  await openWithLocalBundle(
    page,
    await resolvePage(programUrl!, ['Admin.aspx', 'Programadministrasjon.aspx'])
  )
  const admin = await administrationWebPart(page)
  expect(
    (await localBundles(page)).length,
    'the local bundle should be the one loaded'
  ).toBeGreaterThan(0)
  const grid = admin.getByRole('grid').first()
  test.skip((await rowChecks(grid).count()) === 0, 'the test user may not manage the program')
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
    await expect(removeButton(admin), 'nothing is selected after a removal').toBeDisabled()
    const remaining = rowChecks(admin.getByRole('grid').first())
    await remaining.first().click()
    await expect(removeButton(admin)).toBeEnabled()
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
    )
      await addProject(page, admin, title)
  }
})
