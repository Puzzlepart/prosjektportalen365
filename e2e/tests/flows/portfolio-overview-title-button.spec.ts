import { baseURL } from '../../playwright.config'
import { expect, test, webPart } from '../fixtures/pp365'

/**
 * Read-only: in the portfolio overview's title column, the button that opens the project
 * information stays in view however narrow the column is. Pins the defect where a long project
 * name kept its full width and pushed the button past the cell, which clipped it. The test
 * narrows the cells itself, so it holds whatever the project names and column widths are.
 */
const hub = baseURL.replace(/\/+$/, '')

/** The button's name in Norwegian and in English (`ProjectInformationPanelButton`). */
const BUTTON_LABELS = ['Åpne prosjektinformasjonspanel', 'Open Project Information Panel']

test('portfolio overview: the project information button stays in view in a narrow title column', async ({
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
  await expect(overview.getByRole('gridcell').first()).toBeVisible({
    timeout: 90_000
  })
  const buttonSelector = BUTTON_LABELS.map((label) => `button[aria-label="${label}"]`).join(', ')
  test.skip(
    (await overview.locator(buttonSelector).count()) === 0,
    'the overview shows no project information button in its title column'
  )

  // Every cell holding the button at 120 px, narrower than most project names.
  await page.addStyleTag({
    content: BUTTON_LABELS.map((label) => `[role="gridcell"]:has(button[aria-label="${label}"])`)
      .join(', ')
      .concat(
        ' { width: 120px !important; min-width: 120px !important; max-width: 120px !important;' +
          ' flex: 0 0 120px !important; }'
      )
  })
  await page.waitForTimeout(300)

  const results = await page.evaluate((selector) => {
    return Array.from(document.querySelectorAll<HTMLElement>(selector))
      .slice(0, 5)
      .map((button) => {
        button.scrollIntoView({ block: 'center' })
        const rect = button.getBoundingClientRect()
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
        const title = button.closest('[role="gridcell"]')?.textContent?.trim() ?? ''
        // Hit-testing respects the cell's clipping, so a clipped button is not what is hit.
        return {
          title,
          visible: rect.width > 0 && !!hit && button.contains(hit)
        }
      })
  }, buttonSelector)

  expect(results.length).toBeGreaterThan(0)
  for (const { title, visible } of results) {
    expect(visible, `the button beside "${title}" is in view`).toBe(true)
  }
})
