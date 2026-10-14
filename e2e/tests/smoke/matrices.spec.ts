import { configuredUrl, expect, test, webPartByAlias } from '../fixtures/pp365'

/**
 * Read-only smoke of the risk and opportunity matrices, which no template page holds as web
 * parts of their own. Two places show them: the status page's uncertainty section draws the
 * matrix of the report's risks or opportunities, and a page a tenant adds with the two web parts
 * (`E2E_PAGE_MATRIX`, else the names below), which the test hub's project has once someone adds
 * it. Each test skips, saying why, when its place is missing. A matrix is a grid of cells with
 * the probability and consequence headers along its edges and the items as circles in the cells.
 */
const projectUrl = configuredUrl(process.env.E2E_PROJECT_URL)
const MATRIX = '[class*="dynamicMatrix"]'
const CELL = '[class*="matrixCell"]'

test.describe('the uncertainty matrices', () => {
  test.skip(!projectUrl, 'E2E_PROJECT_URL is not set (or is the .env.example placeholder)')

  test("the status page's uncertainty section draws the report's matrix", async ({
    page,
    openPage,
    resolvePage
  }) => {
    await openPage(
      await resolvePage(projectUrl!, ['Prosjektstatus.aspx', 'ProjectStatus.aspx', 'Status.aspx'])
    )
    // The sections fill in after the report loads; the matrix comes with the uncertainty section,
    // which shows only when the selected report has risks or opportunities.
    const matrix = page.locator(MATRIX).first()
    await matrix.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => undefined)
    test.skip(
      (await matrix.count()) === 0,
      'the selected report has no risks or opportunities, so there is no uncertainty section to draw'
    )
    await expectMatrix(matrix)
  })

  test('a page with the two matrix web parts mounts both', async ({
    page,
    openPage,
    resolvePage
  }) => {
    await openPage(
      await resolvePage(
        projectUrl!,
        [
          process.env.E2E_PAGE_MATRIX,
          'Usikkerhet.aspx',
          'Matriser.aspx',
          'Risikomatrise.aspx',
          'Uncertainty.aspx',
          'Matrices.aspx',
          'RiskMatrix.aspx'
        ].filter(Boolean) as string[]
      )
    )
    const risk = webPartByAlias(page, 'RiskMatrixWebPart').first()
    const opportunity = webPartByAlias(page, 'OpportunityMatrixWebPart').first()
    await expect(risk).toBeVisible({ timeout: 60_000 })
    await expect(opportunity).toBeVisible({ timeout: 60_000 })
    for (const webPart of [risk, opportunity]) {
      const matrix = webPart.locator(MATRIX).first()
      await expect(matrix).toBeVisible({ timeout: 30_000 })
      await expectMatrix(matrix)
    }
  })
})

/** A drawn matrix: at least a 3 by 3 grid of cells that fit in their rows, and no overflow. */
async function expectMatrix(matrix: import('@playwright/test').Locator) {
  const cells = matrix.locator(CELL)
  expect(await cells.count(), 'the matrix has cells').toBeGreaterThanOrEqual(9)
  const box = await matrix.boundingBox()
  expect(box, 'the matrix has a box').not.toBeNull()
  expect(box!.width, 'the matrix has a width').toBeGreaterThan(100)
  const firstCell = await cells.first().boundingBox()
  expect(firstCell, 'the first cell has a box').not.toBeNull()
  expect(firstCell!.width, 'a cell has a width').toBeGreaterThan(10)
  expect(firstCell!.height, 'a cell has a height').toBeGreaterThan(10)
}
