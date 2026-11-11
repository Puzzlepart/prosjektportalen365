import { baseURL } from '../../playwright.config'
import { expect, test, webPart } from '../fixtures/pp365'
import { localBundleUse, localBundles, openWithLocalBundle } from '../fixtures/local-bundle'
import { dragFirstColumn, openShowHideColumns } from '../fixtures/edit-view-columns'

/**
 * The drag check of `flows/edit-view-columns-drag.spec.ts` with the *local* PortfolioWebParts
 * bundle on the hub's overview page. Opt in with E2E_LOCAL_BUNDLE=1 while `npm run watch` serves
 * PortfolioWebParts on https://localhost:4321 with the channel's ids. Read-only.
 */
const hub = baseURL.replace(/\/+$/, '')

test.use(localBundleUse)

test('local: a column being dragged in "Vis eller skjul kolonner" stays in view', async ({
  page,
  resolvePage
}) => {
  test.setTimeout(240_000)
  await openWithLocalBundle(
    page,
    await resolvePage(hub, ['Porteføljeoversikt.aspx', 'PortfolioOverview.aspx'])
  )
  const overview = webPart(page, /porteføljeoversikt|portfolio overview/i).first()
  test.skip(
    !(await openShowHideColumns(overview)),
    'the test user is not a site admin, so "Legg til kolonne" is not offered'
  )
  expect(
    (await localBundles(page)).length,
    'the local bundle should be the one loaded'
  ).toBeGreaterThan(0)
  const drag = await dragFirstColumn(page)
  expect(drag.box.x + drag.box.width / 2, 'the dragged column is inside the viewport').toBeLessThan(
    drag.viewport.width
  )
  expect(drag.box.y + drag.box.height / 2).toBeLessThan(drag.viewport.height)
  expect(drag.underPointer, 'the dragged column is drawn under the pointer, on top').toBe(true)
})
