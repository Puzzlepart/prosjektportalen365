/**
 * Accessibility checks in component tests: axe-core through jest-axe, run over what a test
 * rendered. Usage, in a solution's test:
 *
 *   import { axeComponent } from 'pp365-jest-config/lib/axe'
 *
 *   const { container } = render(<FieldContainer label='Tittel'>...</FieldContainer>)
 *   expect(await axeComponent(container)).toHaveNoViolations()
 *
 * The rules are WCAG 2.1 A and AA and WCAG 2.2 AA, the target of #1788
 * (docs/plans/universal-design-wcag.md). Two of them cannot be judged here: jsdom has no layout
 * and no computed colours, so `color-contrast` is off (the browser suite measures it), and a
 * component rendered on its own sits outside any landmark, which only the page's structure
 * decides. axe in jsdom finds missing names, roles and states and broken ARIA references; it
 * cannot tell whether focus moves or what a screen reader says.
 *
 * The matcher is registered when this module is first required, so only the tests that use it
 * load axe-core.
 */
const { configureAxe, toHaveNoViolations } = require('jest-axe')

if (typeof expect !== 'undefined') {
  expect.extend(toHaveNoViolations)
}

/** The axe tags of WCAG 2.1 levels A and AA and of WCAG 2.2 level AA. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const axe = configureAxe({
  runOnly: { type: 'tag', values: WCAG_TAGS },
  rules: {
    'color-contrast': { enabled: false }
  }
})

/**
 * Runs axe over a rendered component: the container `render` returns, or a part of it.
 *
 * @param {Element} element What to check
 * @param {object} [options] axe run options for this call, such as `{ rules: { 'aria-allowed-role': { enabled: false } } }`
 */
function axeComponent(element, options) {
  return axe(element, options)
}

module.exports = { axeComponent, WCAG_TAGS }
