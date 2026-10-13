import { baseURL } from '../../playwright.config'
import { expect, test, webPart } from '../fixtures/pp365'
import { dragFirstColumn, openShowHideColumns } from '../fixtures/edit-view-columns'

/**
 * Read-only: in the portfolio overview's "Vis eller skjul kolonner", a column being dragged is
 * drawn under the pointer. Pins the defect where the drawer's leftover transform made it the
 * containing block of the dragged item's `position: fixed`: the item was placed relative to the
 * drawer, off to the right and clipped by it, so it vanished while dragged and showed again where
 * it was dropped. The drag is cancelled with Escape and nothing is saved.
 *
 * Needs the test user to be a site admin of the hub, like the add-column flow.
 */
const hub = baseURL.replace(/\/+$/, '')

test('portfolio overview: a column being dragged in "Vis eller skjul kolonner" stays in view', async ({
  page,
  openPage,
  resolvePage
}) => {
  test.setTimeout(180_000)
  await openPage(
    await resolvePage(
      hub,
      [process.env.E2E_PAGE_OVERVIEW, 'Porteføljeoversikt.aspx', 'PortfolioOverview.aspx'].filter(
        Boolean
      ) as string[]
    )
  )
  const overview = webPart(page, /porteføljeoversikt|portfolio overview/i).first()
  test.skip(
    !(await openShowHideColumns(overview)),
    'the test user is not a site admin, so "Legg til kolonne" is not offered'
  )
  const drag = await dragFirstColumn(page)
  expect(drag.box.x + drag.box.width / 2, 'the dragged column is inside the viewport').toBeLessThan(
    drag.viewport.width
  )
  expect(drag.box.y + drag.box.height / 2).toBeLessThan(drag.viewport.height)
  expect(drag.underPointer, 'the dragged column is drawn under the pointer, on top').toBe(true)
})
