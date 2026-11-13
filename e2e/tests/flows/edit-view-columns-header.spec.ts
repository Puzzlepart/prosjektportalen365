import { baseURL } from '../../playwright.config'
import { expect, test, webPart } from '../fixtures/pp365'
import { openShowHideColumns, scrolledHeaderLayout } from '../fixtures/edit-view-columns'

/**
 * Read-only: in the portfolio overview's "Vis eller skjul kolonner", the title is the header's
 * heading, on the close button's line, and the actions ("Bruk", "Tilbakestill rekkefølge") sit
 * under it, outside the heading and inside the header. Pins two defects: the actions were
 * absolutely positioned from an empty heading, 16 px below the close button and reaching past the
 * header, so the divider the drawer draws under it once the list is scrolled cut through them;
 * and then they were the heading's content, which named the panel «BrukTilbakestill rekkefølge»
 * while the title was a second heading in the body (#1788, hand round 6).
 *
 * Needs the test user to be a site admin of the hub, like the add-column flow.
 */
const hub = baseURL.replace(/\/+$/, '')

test('portfolio overview: "Vis eller skjul kolonner" is headed by its title, its actions under it in the header', async ({
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
  expect(layout.heading.text, 'the title is the heading').toMatch(
    /rediger visningskolonner|edit displaycolumns/i
  )
  const closeMiddle = layout.close.y + layout.close.height / 2
  expect(
    Math.abs(layout.heading.y + layout.heading.height / 2 - closeMiddle),
    "the title is on the close button's line"
  ).toBeLessThanOrEqual(8)
  expect(layout.actions.map((action) => action.text)).toContain('Bruk')
  for (const action of layout.actions) {
    expect(action.inHeading, `"${action.text}" is not in the heading`).toBe(false)
    expect(action.y, `"${action.text}" is under the title`).toBeGreaterThanOrEqual(
      layout.heading.y + layout.heading.height - 1
    )
    expect(
      action.y + action.height,
      `"${action.text}" ends inside the header, above its divider`
    ).toBeLessThanOrEqual(layout.header.y + layout.header.height)
  }
})
