---
name: pp365-a11y
description: 'Universal design (WCAG 2.1 A and AA) in Prosjektportalen 365: auditing a web part, extension or shared component, fixing what the audit finds, and keeping it fixed with tests. Use when asked to "check accessibility", "universell utforming", "UU", "WCAG", "a11y", "screen reader", "skjermleser", "keyboard navigation", "aria-label", "contrast", "focus", "status message", "axe", "jest-axe", "make this accessible", or when working on issue #1788. Encodes the target and why, what Fluent UI v9 gives and what stays ours, the rules for our code, the audit of one component, the axe scans in Jest and in the browser suite and how a component''s scan turns blocking, how a result is recorded, and the traps found. Pair with pp365-ui for components and pp365-testing for tests.'
---

# Universal design in PP365

The plan, the inventory and the order: `docs/plans/universal-design-wcag.md`. The checklist:
issue #1788. The result per component (Norwegian): `.development-guide/spfx/tilgjengelighet.md`.

## Target

- WCAG 2.1 levels A and AA, as Norway's regulation requires of public bodies through EN 301 549
  v3.2.1; their intranets are covered when new or substantially revised after 1 February 2023, and
  procurement must weigh universal design either way (Uutilsynet). Our customers are mostly public.
- WCAG 2.2's 2.4.11 Focus Not Obscured, 2.5.7 Dragging Movements, 2.5.8 Target Size and 3.3.7
  Redundant Entry are checked too, as "should".
- Ours is what our components render. SharePoint's chrome (page header, list views, command bar,
  property pane), what editors write, and the PnP controls' internals are not; note their findings
  and leave them.

## What Fluent UI v9 gives, and what stays ours

Fluent's components carry keyboard patterns, roles and states, focus handling (`Dialog`,
`OverlayDrawer`, `Menu`, `Popover`, `Combobox`, `TagPicker`, `TabList`, `DataGrid`), visible focus
from the theme and forced-colours support. Ours: names, text alternatives, composites of our own
(matrices, timeline, phase selector, cards, the hub grid's groups), our styles, status messages,
the headings under `WebPartTitle`, colour-only information, form errors, and drag alternatives.

## Rules for our code

Rules 1, 2, 5, 6, 8 and the tooltip handling are adapted from Microsoft's
`detecting-accessibility-issues` skill (`microsoft/vscode-documentdb`, MIT), rewritten for PP365.

1. **Icon-only buttons** get `aria-label` from the strings (`BasePanel`'s close button:
   `strings.CloseText`; `DataGridList` names its selection checks with `DataGridSelectAllLabel`
   and `DataGridSelectRowLabel`, the hub's grid with `ListSelectRowLabel` and
   `ListSelectGroupLabel`). `title` alone shows only on hover and is the last name a browser
   computes: do not rely on it. With a `Tooltip`, `relationship="label"`
   when the trigger has no text, `relationship="description"` when it has; never copy the tooltip
   into `aria-label` as well, or it is read twice.
2. **Visible text is in the name** (2.5.3, voice control): an `aria-label` on a button with text
   starts with that text. An `aria-label` equal to the visible text is noise: drop it.
3. **Every input has a label.** In a `FieldContainer` the control takes the field's id, so the label
   names it and a click on the label reaches it; check `for` against `id` in the browser. A slot
   render function passes on what Fluent wired (kodemonster.md, «Render-funksjoner for slots»:
   `FieldContainer/IconLabel/IconLabel.tsx` puts
   `labelProps.id` and `htmlFor` on its `Label`). A control that ignores the field gets
   `useFieldControlProps_unstable(props, { supportsLabelFor: true })`, as `DateField` does.
   `PeoplePicker` takes the field's label inside a `Field`, else `aria-label`. PnP's
   `ModernTaxonomyPicker` takes no input props, so its label stays apart. A placeholder is no label.
4. **What can be clicked is a button**: Fluent's `Button` or a `<button>`, never a `div` or `span`
   with `onClick` (found: `OverflowTagMenu`, `FilterPanel/Filter`, `DocumentTemplateItem`'s header).
   An expand toggle has `aria-expanded`, and `aria-controls` when the content is elsewhere.
5. **Decoration is hidden, meaning is named.** Fluent's icons are hidden from assistive technology
   already; a decorative `<img>` has `alt=''`, a meaningful one an `alt` from the strings
   (`ProjectLogo`, `SustainabilityGoals`); a `ProgressBar` beside a text that says the same is
   `aria-hidden`.
6. **Status messages are announced** (4.1.3): searches and counts, loading done, saved, failed.
   `const { announce } = useAnnounce()` from `@fluentui/react-components`, then
   `announce(format(strings.X, n), { polite: true })`; a completed action may be a toast instead
   (the `Toaster` has its own live region). Fluent's `MessageBar` (`UserMessage`) announces itself
   the same way. Both speak only under an `AriaLiveAnnouncer`, which only our root providers render.
7. **Focus is kept and shown.** Fluent's `Dialog` and `OverlayDrawer` move focus in and back; an
   overlay of our own does both. Never `outline: none` or `outline: 0` without a `:focus-visible`
   style in its place (found: `EditViewColumnsPanel`, `PackageDetails`). A sticky header must not
   cover the focused row (2.4.11).
8. **Related controls form a group**: `role="group"` with `aria-labelledby` (a toolbar section, a
   pair of move buttons).
9. **Colour** comes from Fluent's tokens, not hex: 4.5:1 for text, 3:1 for large text and for
   non-text that carries meaning (borders of inputs, focus, status icons). Colour is never alone:
   a matrix cell or a status shows its value or its text as well.
10. **Headings**: `WebPartTitle` is the web part's `h2`; a section inside is an `h3`. Panels and
    dialogs take their heading from `DrawerHeaderTitle` and `DialogTitle`.
11. **Targets** are at least 24 by 24 CSS pixels (2.5.8); a transparent button with no padding is
    smaller than it looks.
12. **Drag and drop** has a keyboard way and a single-pointer way (2.1.1, 2.5.7): the move buttons
    of `EditViewColumnsPanel` are the model.
13. **A visualisation without a keyboard model** (`react-calendar-timeline` has none) needs an
    equivalent with the same information in the same place: the project timeline's `TimelineList`
    is the model.
14. **Text comes from the loc triad**: names, announcements, alt texts, never literals.

## The audit of one component

1. **axe in the browser** over the component and every surface it opens: no violation of impact
   serious or critical; the rest listed with a decision.
2. **jest-axe** on its key states, where it has component tests.
3. **Keyboard**: everything reachable and operable, focus visible and in order, no trap, Escape
   closes an overlay and focus returns to what opened it.
4. **Screen reader**: NVDA with Edge or Chrome, VoiceOver with Safari, on the Norwegian test hub:
   names, roles, states and values as shown; status messages announced.
5. **Visual**: zoom 200 %, reflow at 320 CSS px (1280 px wide at 400 %; data tables are exempt),
   text spacing (1.4.12), contrast, Windows contrast themes, colour never alone.
6. **Forms**: labels tied, required marked, errors in text and announced, suggestions given,
   nothing asked twice.
7. **Recorded** (below).

Tools: Accessibility Insights for Web (Microsoft, free: «FastPass» runs axe and shows tab stops,
«Assessment» walks WCAG 2.1 AA by hand), the browser's accessibility tree in DevTools, and
`page.emulateMedia({ forcedColors: 'active' })` in Playwright for contrast themes. Record what was
checked by hand and with which reader and browser: axe finds only part of what WCAG asks.

## Tests

- **Jest**: `import { axeComponent } from 'pp365-jest-config/lib/axe'`, then
  `expect(await axeComponent(container)).toHaveNoViolations()`. WCAG 2.1 A and AA and 2.2 AA
  rules; `color-contrast` is off (jsdom has no layout). Requiring the module registers the matcher.
  A missing name gets a failing test first, `getByRole(role, { name })` where the tree is small
  (pp365-testing on slow queries in large Fluent trees).
- **Browser**: `scanAccessibility(page, { component, include, exclude })` from
  `e2e/tests/fixtures/a11y.ts`. Web parts come from `channelWebPartsOnPage(page)` (the channel
  under test's ids, so another channel's package is never scanned as ours); dialogs, drawers and
  popovers from `SURFACES`. The page scans are `e2e/tests/smoke/a11y-baseline.spec.ts`; a surface
  is scanned in the spec that opens it.
- **Report, then blocking** (the plan's D2): a scan attaches `axe-<component>.json` and an `a11y`
  annotation and fails nothing, until the component's audit is done; then its name goes into
  `A11Y_BLOCKING` in the same commit, and from there a serious or critical violation fails the run.
  The annotations are in the HTML report on the test report site (pp365-release, «After the run»).

## Recording

- The component's row in `.development-guide/spfx/tilgjengelighet.md`: date, axe, keyboard,
  screen reader, visual, forms, and what was found, fixed or deferred with an issue.
- Its box in #1788, with the commit or pull request.
- The plan's slice log: what was done, found and left.

## Traps found

- `useAnnounce()` returns a function that does nothing when no `AriaLiveAnnouncer` is above it
  (`@fluentui/react-shared-contexts`), and `FluentProvider` renders none: every `MessageBar` was
  silent until our root providers rendered one. A provider of ours inside a wrapper is still wrong
  (pp365-ui); the announcer goes where the root provider is.
- `react-calendar-timeline` 0.28 has no keyboard handling and no roles.
- axe scoped to our markup still judges rules that need the page (landmarks, the page's headings);
  such findings belong to SharePoint's page and are noted, not fixed in our code.
- Under jsdom contrast cannot be measured, and Fluent's menus and popovers are slow
  (pp365-testing): test names and roles there, contrast and focus in the browser.

## Do not

- Do not call a component accessible on axe's word alone.
- Do not add `aria-*` to quiet axe without hearing the result in a screen reader:
  `aria-hidden` on something focusable, or a role on an element without its keyboard behaviour,
  makes things worse.
- Do not hard-code a name, an announcement or an alt text.
