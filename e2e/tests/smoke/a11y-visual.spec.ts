import { Locator, Page } from '@playwright/test'
import { settleWebParts, waitForContent } from '../fixtures/a11y'
import { A11Y_PAGES } from '../fixtures/pages'
import { channelWebPartsOnPage, test } from '../fixtures/pp365'

/**
 * Visual checks of the pages for universal design (#1788, docs/plans/universal-design-wcag.md),
 * the part of the hand round's visual step a browser can measure. Read-only, and reporting only:
 * each web part gets a `visual` annotation with what was found and, attached, the measurements
 * and a picture per check, for the hand round to look through.
 *
 * - Reflow (WCAG 1.4.10): at 320 CSS px wide, what in the web part reaches past its right edge,
 *   where the page would have to scroll sideways or the content is cut off. Data tables, grids
 *   and the timelines need two dimensions and are exempt.
 * - Text spacing (1.4.12): with line height 1.5, paragraph spacing 2, letter spacing 0.12 and word
 *   spacing 0.16 (the criterion's values, applied as its bookmarklet does), the text that is cut
 *   off and was not before.
 * - Forced colours (Windows contrast themes): a picture only; whether borders, focus and states
 *   still show is judged by eye.
 */

/** The criterion's text spacing, as the WCAG text spacing bookmarklet applies it. */
const TEXT_SPACING =
  '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}' +
  'p{margin-bottom:2em!important}'

/** Two-dimensional content, exempt from reflow. */
const REFLOW_EXEMPT =
  'table, [role="table"], [role="grid"], [role="treegrid"], .react-calendar-timeline, pre, code'

/** Picture settings: small enough for the report site, sharp enough to judge. */
const PICTURE = { type: 'jpeg', quality: 70, animations: 'disabled' } as const

/** What in a web part reaches past its right edge at the current width. */
async function measureReflow(webPart: Locator) {
  return webPart.first().evaluate((root, exempt) => {
    const describe = (element: Element) => {
      const classes =
        typeof element.className === 'string'
          ? element.className
              .split(/\s+/)
              // Fluent's atomic classes say nothing about which element it is.
              .filter((name) => name && !/^(f[a-z0-9]{5,8}|r[a-z0-9]{5,8}|___\w+)$/.test(name))
              .slice(0, 2)
          : []
      const text = ((element as HTMLElement).innerText ?? '').trim().replace(/\s+/g, ' ')
      return `${element.tagName.toLowerCase()}${classes.map((name) => '.' + name).join('')}${text ? ` "${text.slice(0, 40)}"` : ''}`
    }
    // Two pixels of slack: a box's right edge is a fraction, and rounding put whole rows one over.
    const edge = Math.min(root.getBoundingClientRect().right, window.innerWidth) + 2
    const wide = Array.from(root.querySelectorAll('*')).filter((element) => {
      if (element.closest(exempt)) return false
      const box = element.getBoundingClientRect()
      if (box.width === 0 || box.height === 0) return false
      const style = getComputedStyle(element)
      return style.visibility !== 'hidden' && box.right > edge
    })
    // The outermost only: everything inside a wide element is wide with it.
    const outermost = wide.filter(
      (element) => !wide.some((other) => other !== element && other.contains(element))
    )
    return {
      viewportWidth: window.innerWidth,
      pageScrollsSideways: document.documentElement.scrollWidth > window.innerWidth + 1,
      count: outermost.length,
      elements: outermost.slice(0, 15).map((element) => ({
        element: describe(element),
        right: Math.round(element.getBoundingClientRect().right)
      }))
    }
  }, REFLOW_EXEMPT)
}

/**
 * The elements of a web part whose text does not fit their own box, keyed by a description: the
 * text, and whether it ends in «…» (`text-overflow: ellipsis` across, a line clamp down), as the
 * titles, dates and tags of the lists do with the whole text in their title, which is accepted
 * (decided 2026-10-20). Text that is cut off without «…» is what needs a look.
 */
async function clippedText(
  webPart: Locator
): Promise<Record<string, { text: string; ellipsis: boolean }>> {
  return webPart.first().evaluate((root) => {
    const clipped: Record<string, { text: string; ellipsis: boolean }> = {}
    const all = Array.from(root.querySelectorAll<HTMLElement>('*'))
    all.forEach((element, index) => {
      const style = getComputedStyle(element)
      if (!/hidden|clip/.test(`${style.overflowX} ${style.overflowY}`)) return
      const text = (element.innerText ?? '').trim().replace(/\s+/g, ' ')
      if (!text || element.offsetWidth === 0 || element.offsetHeight === 0) return
      const across = element.scrollWidth > element.clientWidth + 1
      const down = element.scrollHeight > element.clientHeight + 1
      if (across || down) {
        const clamped = style.getPropertyValue('-webkit-line-clamp')
        const ellipsis =
          (!across || style.textOverflow === 'ellipsis') &&
          (!down || (!!clamped && clamped !== 'none'))
        clipped[`${index}:${element.tagName.toLowerCase()}`] = { text: text.slice(0, 60), ellipsis }
      }
    })
    return clipped
  })
}

/** Attaches a picture of the web part as it is now. */
async function picture(webPart: Locator, name: string) {
  const body = await webPart
    .first()
    .screenshot({ ...PICTURE, timeout: 15_000 })
    .catch(() => undefined)
  if (body) await test.info().attach(name, { body, contentType: 'image/jpeg' })
}

/** Removes the text spacing again. */
async function removeTextSpacing(page: Page) {
  await page.evaluate(() => document.getElementById('pp365-text-spacing')?.remove())
}

test.describe('visual checks of the pages', () => {
  for (const entry of A11Y_PAGES) {
    test(`the ${entry.name}'s web parts at 320 px, with text spacing and in forced colours`, async ({
      page,
      openPage,
      resolvePage
    }) => {
      test.setTimeout(240_000)
      const site = entry.site()
      test.skip(!site, `the site of the ${entry.name} is not configured`)
      await page.setViewportSize({ width: 1280, height: 900 })
      await openPage(await resolvePage(site!, entry.pages))
      await settleWebParts(page)
      const parts = await channelWebPartsOnPage(page)
      test.skip(parts.length === 0, `the ${entry.name} has no web part of the channel under test`)
      await waitForContent(
        page,
        parts.map((part) => part.selector)
      )
      const findings: Record<string, string[]> = {}
      const note = (alias: string, text: string) => (findings[alias] ??= []).push(text)

      // Text spacing, at the full width: what is cut off with it and was not without it.
      for (const part of parts) {
        const before = await clippedText(page.locator(part.selector))
        await page.evaluate((css) => {
          const style = document.createElement('style')
          style.id = 'pp365-text-spacing'
          style.textContent = css
          document.head.appendChild(style)
        }, TEXT_SPACING)
        await page.waitForTimeout(1_000)
        const after = await clippedText(page.locator(part.selector))
        const changed = Object.entries(after)
          .filter(([key]) => !(key in before))
          .map(([, found]) => found)
        const cut = changed.filter((found) => !found.ellipsis).map((found) => found.text)
        const shortened = changed.filter((found) => found.ellipsis).map((found) => found.text)
        note(part.alias, `text spacing: ${cut.length} cut off, ${shortened.length} end in «…»`)
        await test.info().attach(`text-spacing-${part.alias}.json`, {
          body: JSON.stringify(
            {
              cutOff: cut,
              endsInEllipsis: shortened,
              cutOffBefore: Object.values(before)
                .filter((found) => !found.ellipsis)
                .map((found) => found.text)
            },
            null,
            2
          ),
          contentType: 'application/json'
        })
        await picture(page.locator(part.selector), `text-spacing-${part.alias}.jpg`)
        await removeTextSpacing(page)
      }

      // Forced colours: a picture to judge.
      await page.emulateMedia({ forcedColors: 'active' })
      await page.waitForTimeout(1_000)
      for (const part of parts) {
        await picture(page.locator(part.selector), `forced-colors-${part.alias}.jpg`)
      }
      await page.emulateMedia({ forcedColors: 'none' })

      // Reflow at 320 CSS px: what reaches past the web part's right edge.
      await page.setViewportSize({ width: 320, height: 900 })
      await page.waitForTimeout(2_000)
      for (const part of parts) {
        const reflow = await measureReflow(page.locator(part.selector)).catch((error) => ({
          error: String((error as Error)?.message ?? error).split('\n')[0]
        }))
        if ('error' in reflow) {
          note(part.alias, `320 px: not measured (${reflow.error})`)
          continue
        }
        note(
          part.alias,
          `320 px: ${reflow.count} wider than the page` +
            (reflow.pageScrollsSideways ? ', the page scrolls sideways' : '')
        )
        await test.info().attach(`reflow-${part.alias}.json`, {
          body: JSON.stringify(reflow, null, 2),
          contentType: 'application/json'
        })
        await picture(page.locator(part.selector), `reflow-${part.alias}.jpg`)
      }

      for (const [alias, texts] of Object.entries(findings)) {
        test
          .info()
          .annotations.push({ type: 'visual', description: `${alias}: ${texts.join('; ')}` })
      }
    })
  }
})
