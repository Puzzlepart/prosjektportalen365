import { baseURL } from '../../playwright.config'
import { expect, test, webPart } from '../fixtures/pp365'
import { openShowHideColumns, scrolledHeaderLayout } from '../fixtures/edit-view-columns'

/**
 * Read-only: in the portfolio overview's "Vis eller skjul kolonner", the header's actions ("Bruk",
 * "Tilbakestill rekkefølge") sit on the close button's line and inside the header. Pins the defect
 * where they were absolutely positioned from an empty heading: 16 px below the close button and
 * reaching past the header, so the divider the drawer draws under it once the list is scrolled
 * cut through them.
 *
 * Needs the test user to be a site admin of the hub, like the add-column flow.
 */
const hub = baseURL.replace(/\/+$/, '')

test('portfolio overview: the actions in "Vis eller skjul kolonner" line up with the close button', async ({
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
  const layout = await scrolledHeaderLayout(page)
  expect(layout.actions.map((action) => action.text)).toContain('Bruk')
  const closeMiddle = layout.close.y + layout.close.height / 2
  for (const action of layout.actions) {
    expect(
      Math.abs(action.y + action.height / 2 - closeMiddle),
      `"${action.text}" is on the close button's line`
    ).toBeLessThanOrEqual(2)
    expect(
      action.y + action.height,
      `"${action.text}" ends inside the header, above its divider`
    ).toBeLessThanOrEqual(layout.header.y + layout.header.height)
  }
})
