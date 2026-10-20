import { scanAccessibility, settleWebParts, waitForContent } from '../fixtures/a11y'
import { A11Y_PAGES } from '../fixtures/pages'
import { channelWebPartsOnPage, test } from '../fixtures/pp365'

/**
 * Accessibility scans of the pages (#1788, docs/plans/universal-design-wcag.md): axe over every
 * PP365 web part of the channel under test on the pages the smoke suite opens, one test per page.
 * Read-only. Each web part's result is attached as `axe-<alias>.json` and counted in an `a11y`
 * annotation; the scans fail only for the web parts whose audit is done (`A11Y_BLOCKING` in
 * `fixtures/a11y.ts`). The dialogs, drawers and popovers are scanned by the specs that open them.
 * A page the site does not have is skipped with the pages it does have.
 */
test.describe('accessibility of the pages', () => {
  for (const entry of A11Y_PAGES) {
    test(`the ${entry.name}'s web parts`, async ({ page, openPage, resolvePage }) => {
      test.setTimeout(180_000)
      const site = entry.site()
      test.skip(!site, `the site of the ${entry.name} is not configured`)
      await openPage(await resolvePage(site!, entry.pages))
      await settleWebParts(page)
      const parts = await channelWebPartsOnPage(page)
      test.skip(parts.length === 0, `the ${entry.name} has no web part of the channel under test`)
      await waitForContent(
        page,
        parts.map((part) => part.selector)
      )
      for (const part of parts) {
        await scanAccessibility(page, { component: part.alias, include: [part.selector] })
      }
    })
  }
})
