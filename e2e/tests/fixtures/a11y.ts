import AxeBuilder from '@axe-core/playwright'
import { Page, test } from '@playwright/test'
import { expect, WEB_PART } from './pp365'

/**
 * Waits, at most `timeout`, until the number of web parts on the page has stopped changing for
 * two seconds. SharePoint mounts a page's web parts one by one as their bundles load, and
 * `openPage` waits for the first only: on the matrix page the first baseline (2026-10-14) found
 * the risk matrix and not yet the opportunity matrix. The page is not scrolled, so a web part
 * SharePoint mounts only when it comes into view (the project home's news) is scanned by its
 * component's own test instead: scrolling the program home brought its document list into view,
 * whose list command set then failed to load its strings (2026-10-14), a fault of its own that
 * the console guard would report on every run.
 *
 * @param page The page
 * @param timeout How long to wait, in milliseconds
 */
export async function settleWebParts(page: Page, timeout = 20_000): Promise<void> {
  const deadline = Date.now() + timeout
  let count = -1
  let stableSince = Date.now()
  while (Date.now() < deadline) {
    const current = await page.locator(WEB_PART).count()
    if (current !== count) {
      count = current
      stableSince = Date.now()
    } else if (Date.now() - stableSince >= 2_000) {
      break
    }
    await page.waitForTimeout(500)
  }
}

/**
 * Accessibility scans in the browser suite (#1788, docs/plans/universal-design-wcag.md): axe-core
 * over the markup of one PP365 component, with the rules of WCAG 2.1 levels A and AA and of WCAG
 * 2.2 level AA. A scan attaches what it found to the test (`axe-<component>.json`) and notes the
 * counts as an `a11y` annotation, which the HTML report shows with the test.
 *
 * The scans report and fail nothing until a component's audit is done (the plan's D2): then the
 * component goes into A11Y_BLOCKING, and from that commit a violation of impact serious or
 * critical in its markup fails the test, so a finished component cannot slip back.
 *
 * axe finds missing names and roles, broken ARIA, contrast it can compute and the like; it cannot
 * tell whether focus moves sensibly or what a screen reader says, which the audit checks by hand.
 */

/** The axe tags of WCAG 2.1 levels A and AA and of WCAG 2.2 level AA. */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/**
 * The components whose audit is done, by the name the scans give them (a web part's alias in
 * `channels/<channel>.json`, or a surface's name such as "RiskActionPanel"). A component joins in
 * the commit that finishes its audit, with its row in the conformance overview.
 */
export const A11Y_BLOCKING: ReadonlySet<string> = new Set<string>([])

/** Fluent UI v9's surfaces that render in a portal, outside the web part: where our dialogs, drawers and popovers are. */
export const SURFACES = {
  dialog: '.fui-DialogSurface',
  drawer: '.fui-OverlayDrawer',
  popover: '.fui-PopoverSurface'
} as const

/**
 * Fluent's own markup that axe misjudges, left out of every scan. Fluent's focus manager (Tabster)
 * puts focusable `<i data-tabster-dummy>` sentinels, hidden from assistive technology, at the edges
 * of focus groups (toolbars, tag groups, tab lists, grids); they pass focus straight on, and axe's
 * `aria-hidden-focus` flagged every one of them in the first baseline (2026-10-14).
 */
export const FLUENT_INTERNALS = ['i[data-tabster-dummy]']

export interface IA11yScope {
  /** The component, as the conformance overview names it. */
  component: string
  /** CSS selectors of the markup that is ours. */
  include: string[]
  /** CSS selectors inside it that are not ours (SharePoint's, PnP's), left out. */
  exclude?: string[]
}

/** A rule axe found broken, as the attachment and the annotation give it. */
export interface IA11yViolation {
  id: string
  impact: string
  help: string
  helpUrl: string
  nodes: number
  targets: string[]
}

/**
 * Runs axe over a component's markup, attaches the result to the test and notes the counts.
 * Reports only, unless the component is in A11Y_BLOCKING: then a serious or critical violation
 * fails the test. A scan that cannot run (the markup gone, the page navigating) is noted and,
 * for a component not yet blocking, does not fail the test either.
 *
 * @param page The page
 * @param scope The component and its markup
 */
export async function scanAccessibility(page: Page, scope: IA11yScope): Promise<IA11yViolation[]> {
  const info = test.info()
  const blocking = A11Y_BLOCKING.has(scope.component)
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS)
  for (const selector of scope.include) builder = builder.include(selector)
  for (const selector of [...FLUENT_INTERNALS, ...(scope.exclude ?? [])]) {
    builder = builder.exclude(selector)
  }
  let violations: IA11yViolation[]
  try {
    await waitForAnimations(page)
    const results = await builder.analyze()
    violations = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact ?? 'unknown',
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.length,
      targets: violation.nodes.slice(0, 5).map((node) => String(node.target))
    }))
  } catch (error) {
    if (blocking) throw error
    const reason = String((error as Error)?.message ?? error).split('\n')[0]
    info.annotations.push({
      type: 'a11y',
      description: `${scope.component}: not scanned (${reason})`
    })
    return []
  }
  await info.attach(`axe-${scope.component}.json`, {
    body: JSON.stringify({ ...scope, tags: WCAG_TAGS, violations }, null, 2),
    contentType: 'application/json'
  })
  const byImpact = ['critical', 'serious', 'moderate', 'minor']
    .map((impact) => [impact, violations.filter((v) => v.impact === impact).length] as const)
    .filter(([, count]) => count > 0)
    .map(([impact, count]) => `${count} ${impact}`)
  info.annotations.push({
    type: 'a11y',
    description:
      violations.length === 0
        ? `${scope.component}: no violation`
        : `${scope.component}: ${byImpact.join(', ')}: ${violations.map((v) => `${v.id} (${v.nodes})`).join(', ')}`
  })
  if (blocking) {
    const severe = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(
      severe,
      `${scope.component} breaks WCAG rules axe can check (see axe-${scope.component}.json)`
    ).toEqual([])
  }
  return violations
}

/**
 * Waits, at most `timeout`, for the page's finite animations to end. Fluent fades and slides its
 * dialogs, drawers and popovers in; measured mid-way, their text blends with the backdrop and axe
 * reports contrast that is not there. Endless animations (spinners, skeletons) are not waited for.
 *
 * @param page The page
 * @param timeout How long to wait, in milliseconds
 */
export async function waitForAnimations(page: Page, timeout = 2_000): Promise<void> {
  await page.evaluate(
    (ms) =>
      Promise.race([
        Promise.all(
          document
            .getAnimations()
            .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
            .map((animation) => animation.finished.catch(() => undefined))
        ),
        new Promise((resolve) => setTimeout(resolve, ms))
      ]),
    timeout
  )
}

/**
 * Waits, at most `timeout`, until the markup no longer shows Fluent's skeletons or spinners, so a
 * scan sees the component with its data rather than its loading state. A component still loading
 * after that is scanned as it is.
 *
 * @param page The page
 * @param selectors The components' markup
 * @param timeout How long to wait, in milliseconds
 */
export async function waitForContent(page: Page, selectors: string[], timeout = 30_000) {
  const loading = selectors
    .flatMap((selector) => [`${selector} .fui-Skeleton`, `${selector} .fui-Spinner`])
    .join(', ')
  await expect(page.locator(loading))
    .toHaveCount(0, { timeout })
    .catch(() => undefined)
}
