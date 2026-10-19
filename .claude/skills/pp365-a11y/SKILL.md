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
   starts with that text. An `aria-label` equal to the visible text is noise: drop it. A text
   that does not say what the button does (a count) is no name (2.4.6): a toolbar item takes
   one that holds the text through `ListMenuItem.setAriaLabel` (the dynamic list's export,
   «Eksporter 3 valgte elementer til Excel»). Nor does a selector's current value: it adds what
   it selects, `format(strings.SelectorButtonLabel, value, purpose)` («Alle prosjekter,
   Porteføljevisninger», the portfolio overview's view and portfolio selectors).
3. **Every input has a label.** In a `FieldContainer` the control takes the field's id, so the label
   names it and a click on the label reaches it; check `for` against `id` in the browser. A slot
   render function passes on what Fluent wired (kodemonster.md, «Render-funksjoner for slots»:
   `FieldContainer/IconLabel/IconLabel.tsx` puts
   `labelProps.id` and `htmlFor` on its `Label`). A control that ignores the field gets
   `useFieldControlProps_unstable(props, { supportsLabelFor: true })`, as `DateField` does.
   `PeoplePicker` takes the field's label inside a `Field`, else `aria-label`. PnP's
   `ModernTaxonomyPicker` takes no input props, so its label stays apart. A placeholder is no label.
4. **What can be clicked is a button**: Fluent's `Button` or a `<button>`, never a `div` or `span`
   with `onClick` (found: `FilterPanel/Filter`, `DocumentTemplateItem`'s header). An expand toggle
   has `aria-expanded`, and `aria-controls` when the content is elsewhere. What goes somewhere is
   a link with `href` (Fluent's `Link`), not a button calling `window.open` (`FileNameColumn`); a
   `Link` without `href` renders a button, right for an action (`DialogColumn`). A link that looks
   like a button is `Button as='a'` with `href` (Fluent keeps the link role while there is one),
   in a `SplitButton` `primaryActionButton={{ as: 'a', href }}`, in a menu `MenuItemLink` (the
   footer). What does nothing
   is no control: tags that only label are `Tag`s, not `InteractionTag`s (`OverflowTagMenu`).
5. **Decoration is hidden, meaning is named.** Fluent's icons are hidden from assistive technology
   already, so an icon that says something alone is named: `role="img"` and an `aria-label` from
   the strings on its container (`TrendColumn`). A decorative `<img>` has `alt=''`
   (`FileTypeIcon`), a meaningful one an `alt` from the strings (`ProjectLogo`,
   `SustainabilityGoals`); a `ProgressBar` beside a text that says the same is `aria-hidden`, and
   so is an `Avatar` beside the name it shows (`PeoplePicker`, `UserColumn`).
6. **Status messages are announced** (4.1.3): searches and counts, loading done, saved, failed.
   `const { announce } = useAnnounce()` from `@fluentui/react-components`, then
   `announce(format(strings.X, n), { polite: true })`; a completed action may be a toast instead
   (the `Toaster` has its own live region). Fluent's `MessageBar` (`UserMessage`) announces itself
   the same way. Both speak only under an `AriaLiveAnnouncer`, which only our root providers render.
   An action that changes content (an upload, a new document, a deletion) says that it did, and
   why it did not, in a toast seen by all (the dynamic list's `useNotify`); a search tells its
   count once typing stops, not per keystroke (`DynamicList/useAnnouncements.ts`).
7. **Focus is kept and shown.** Fluent's `Dialog` and `OverlayDrawer` move focus in and back; an
   overlay of our own does both. Never `outline: none` or `outline: 0` without a `:focus-visible`
   style in its place (found: `EditViewColumnsPanel`, `PackageDetails`). A sticky header must not
   cover the focused element (2.4.11): give what scrolls under it `scroll-margin-top`, the
   focusable descendants too (`ProjectStatus`'s `BaseSection`: `* { scroll-margin-top: 80px }`).
   A view that replaces the element with focus (an item or folder opened from a list, a toolbar
   swapped for a spinner) drops focus to the page's start (2.4.3): give it to the new view's
   heading or the breadcrumb's current crumb, and on going back to the link left
   (`DynamicList/useNavigationFocus.ts`, `DocumentTemplateDialog/useFolderFocus.ts`); keep a
   toolbar mounted while its action runs. A `DataGridList` draws its rows a render after the
   screen, and a list fetched from SharePoint later still: look for the link again for a while,
   and leave the focus alone if the user has moved it meanwhile (`useFolderFocus`).
8. **Related controls form a group**: `role="group"` with `aria-labelledby` (a toolbar section, a
   pair of move buttons).
9. **Colour** comes from Fluent's tokens, not hex: 4.5:1 for text, 3:1 for large text and for
   non-text that carries meaning (borders of inputs, focus, status icons). Colour is never alone:
   a matrix cell or a status shows its value or its text as well. Colours from configuration
   (the timeline's) go through `util/contrast.ts`: `getReadableTextColor` keeps the configured
   text colour where it reads 4.5:1 and puts black or white in its place where it does not;
   `getContrastingShade` darkens a configured colour just until it reaches 3:1 against the
   fainter background (the timeline's grey rows, `#f2f2f2`), for an edge; `getTint` makes the
   light tone a bar is filled with. A configured colour is the customer's choice: draw it so it
   holds whatever it is, rather than changing it. An icon is framed the same way: its regular
   variant, the filled one's outline, drawn over it in the shade (`TrendColumn`, where gold and
   green were under 3:1). `parseColor` reads hex and `rgb()`, not names: a colour from code is
   hex (the benefit model's trophy was `'gold'`). A timeline bar whose fill fades (the resource
   allocation's) names its full colour as `data.edgeColor`, and the timeline edges it in that,
   darkened the same way.
10. **Headings**: `WebPartTitle` is the web part's `h2`; a section inside is an `h3`
    (`WebPartTitle headingLevel={3}`, as the project information's parent projects). Panels and
    dialogs take their heading from `DrawerHeaderTitle` and `DialogTitle`. Name and value pairs
    are a description list (`dl`, `dt`, `dd`), as the project properties are. The status
    report's sections are headed by their status element (`StatusElement asHeading`), and a
    status shown by an icon alone is named by its section and its value.
11. **Targets** are at least 24 by 24 CSS pixels (2.5.8); a transparent button with no padding is
    smaller than it looks.
12. **Drag and drop** has a keyboard way and a single-pointer way (2.1.1, 2.5.7): the move buttons
    of `EditViewColumnsPanel` are the model.
13. **A visualisation without a keyboard model** (`react-calendar-timeline` has none) gets one
    where we render its parts: the timeline's items are buttons through our `itemRenderer`, its
    scroll area a named, focusable group through `scrollRef`. Where that is not enough, an
    equivalent with the same information in the same place: the project timeline's
    `TimelineList` is the model.
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
- **A fix in a shared wrapper changes the markup the consumers' tests read.** Run every solution's
  `npm test` before handing it over, not only the library's: the status header's test read
  `WebPartTitle`'s old `title`, and the release build failed on three pushes before it was seen
  (2026-10-15); a failing solution also stops those that depend on it from being tested.
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
- Messages announced while a root mounts (a child's first effect) wait in the announcer's queue:
  its live region is made in its own effect, which runs after its children's on the first render.
  Announce what follows an action or a load, as status messages do.
- Fluent's `InfoLabel` names its info button "information", in English, when the label is empty
  (`WebPartTitle`'s was): pass `infoButton={{ 'aria-label': … }}` from the strings.
- axe measuring a dialog, drawer or popover while Fluent animates it in reports contrast that is
  not there (the text blends with the backdrop): `scanAccessibility` waits for finite animations
  first (`waitForAnimations`).
- Fluent's `TagGroup` is a `toolbar` and its `InteractionTag` a button, whatever the tags do:
  labels are `Tag`s with `role='listitem'` in a `TagGroup role='list'` (`OverflowTagMenu`).
- `MenuTrigger` puts `aria-haspopup` and `aria-expanded` on its child. Around an `InteractionTag`
  that is the tag's `div`, not the button inside it: wrap the `InteractionTagPrimary`.
- Spreading a data object onto a Fluent component passes its every key as a prop: the project
  list's people carried `role` (the field's internal name) from the data adapter, and every
  `Avatar` got `role="GtProjectManager"`, axe's critical `aria-roles` 36 times; the idea
  module's `Persona` got the login name as its `id`. Pick the props.
- Steps or phases shown in order, one of them current, are an ordered list with
  `aria-current="step"`, not a `TabList` of tabs that do nothing (`IdeaPhaseBar`). A list styled
  without markers keeps `role="list"` explicit: Safari drops the role otherwise.
- Two buttons that toggle the same thing from different places, each gone when the other shows
  (the idea module's menu button in the menu and beside the content), take the focus over from
  each other: a ref each, focused after the toggle (`useIdeaModule`).
- `@hello-pangea/dnd` announces drags and explains its handles in English: give
  `DragDropContext` `dragHandleUsageInstructions` from the strings and announce through the
  responders' `provided.announce` (`EditViewColumnsPanel`). A control shown only on `:hover` is out
  of the keyboard's reach, `display: none` taking it from the tab order: show it on
  `:focus-within` too.
- A link inside a `MenuItem` is out of the keyboard's reach: the item takes the focus and does
  nothing on Enter. Use `MenuItemLink` with `href` (`ProjectMenu`). So is a link inside a
  `Tooltip`: the footer's useful links held the list's in theirs; it is a menu item now.
- A `SplitButton`'s menu button with no name of its own is named by the primary button, so both
  read the same: give it one. `MenuTrigger` goes round a render function that hands its props
  to `menuButton`; round a `Tooltip` round the split button, the trigger's state lands on the
  split button's frame. A tooltip that describes the primary button goes on it through the slot's
  render function, `primaryActionButton={{ children: (Component, props) => <Tooltip …><Component
  {...props} /></Tooltip> }}`, which gets the slot's text in `props` (the footer's
  `SiteSettings`).
- A button with a `title` and a `Tooltip` of the same text as its description is read twice:
  give the tooltip `relationship='label'` and drop the title (the project card's panel button).
- Fluent's `Avatar` is an `img` named by its `name`, so beside the same name in text a screen
  reader reads the name twice: `aria-hidden` there; alone, it keeps its name. Fluent's `Persona`
  does not hide its own: pass `avatar={{ 'aria-hidden': true, … }}` (`ProjectProperty`,
  `TimelineList`).
- A Fluent `Dialog` is named by its `DialogTitle`, described by nothing, and opens with focus on
  its first button: a dialog whose text is the point (a confirmation) points `aria-describedby`
  on `DialogSurface` at its `DialogContent` (`useConfirmationDialog`).
- Fluent's `PopoverTrigger` makes its child a button (`useARIAButtonProps`) even with
  `disableButtonEnhancement`: on an `li` that takes the item's role, and the list has none (axe's
  `list`). Put a `<button>` in the `li` (`ProjectPhases/ProjectPhase`).
- A `Popover` with controls in it needs `trapFocus`. Without it the surface sits in a portal at the
  end of the page, and Tab from its last control went to the top of the page, leaving the popover
  open. With it, Fluent names the surface a dialog: name it (`aria-labelledby` its heading). A
  popover with no control in it (a gauge, a text) leaves the focus on its trigger, and nothing is
  heard to open: `tabIndex={-1}` on `PopoverSurface` makes Fluent focus the surface, named and
  described by what it shows (`InstrumentColumn`, the timeline's `DetailsPopover`, whose
  milestones and phases have no link).
- A button that cannot be used yet but explains why in its `title` is `disabledFocusable`, not
  `disabled` (`Toolbar` does so for every disabled item since #1788): a disabled button is skipped by the keyboard and its reason never reached. It also
  keeps the focus while an action it started runs (the change-phase dialog's statuses).
- A status message in Jest: the announcer writes each message as `innerText` on a new span, which
  jsdom keeps as a property, not as text, and clears the region through `innerText` too, which
  jsdom ignores: read the last span's `innerText` in the live region, or a second message reads
  as the first (`ProjectSetupDialog.test.tsx`).
- A `UserMessage` (Fluent's `MessageBar`) announces itself when it mounts, hidden or not: one in a
  `hidden` container was read out on every project setup («Prosjektdata funnet»), and one in a
  `FieldContainer` with `hidden` on every opening of the portfolio overview's view form. Render it
  only when it applies. A message announced while the root mounts waits in the queue and comes out
  with the next announcement, so a test that triggers one sees it. Nor is a message bar an empty
  state in a list's cells: in a field customizer each row's announces itself (the risk actions'
  «no actions», now a button with its look).
- A `Popover` with `trapFocus` is a `dialog` to `getByRole`: a browser test that found «the»
  dialog by role alone finds two when a dialog opens from the popover; find dialogs by name. A
  `Dialog` opened from inside such a popover still takes the focus and gives it back on Escape
  (probed with the real components, `RiskActionPopover`).
- jest-axe over a stand-in judges the stand-in. The combobox family (`Autocomplete`,
  `PeoplePicker`, `ColumnSearchPropertyField`) runs on stand-ins in Jest: assert names there and
  let the browser scans judge the markup.
- `opacity: 0` hides nothing from a screen reader or the keyboard: the matrices drew both the
  before and after positions and faded one out, and both were read. Hide with `visibility`, and
  transition it with the opacity so the fade still runs (`MatrixElement.module.scss`). Where it
  is shown on `:hover`, show it on `:focus-within` too, or the keyboard works in the dark (the
  minimized footer).
- A grid whose rows and columns mean something is a table: `role="table"` named by its title,
  `row`, `columnheader`, `rowheader` and `cell` on the divs (`DynamicMatrix`), so a screen reader
  tells where an element sits. Its look stays the grid's.
- Content only in a tooltip is out of the keyboard's reach: make the trigger focusable (the
  tooltip then shows on focus) and give the content as its description, `aria-describedby` a
  hidden copy, with the tooltip's `relationship='inaccessible'` so it is not read twice
  (`MatrixElement`). Where the tooltip holds the name only, the focus is enough: several people
  in a `UserColumn` cell, the project cards' people, phase and type. In the hub's grid such
  stops are reached by the arrow keys, not Tab. Give them a `:focus-visible` outline.
- A description that points at an element named by `aria-label` (a drawing's `img`) comes out
  without it under Testing Library: `dom-accessibility-api` uses a referenced `aria-label` for
  names only. Put the text in a hidden element that both names the drawing (`aria-labelledby`)
  and describes the surface (`InstrumentColumn`).
- `react-calendar-timeline` 0.28 has no keyboard handling and no roles, but it draws each item
  with our `itemRenderer` and hands its scroll area (`.rct-scroll`) to `scrollRef`: that is where
  roles, names and keys go (`ProjectTimeline/Timeline/useItemRenderer.tsx`, `useTimeline.ts`).
  Its scroll area scrolls with the arrow keys once it can take focus.
- A Fluent `Popover` positioned on an element, with no `PopoverTrigger`, gives focus back to
  nothing when it closes: return it on Escape yourself (`useTimeline`'s `onDetailsDismiss`).
- A Fluent `Dialog` or drawer opened from state, with no `DialogTrigger`, gives focus back to
  nothing either: Tabster's restorer returns it only to an element marked as a restore target,
  which `DialogTrigger` marks. Spread `useRestoreFocusTarget()` on the button that opens it
  (`ProjectCardFooter`, `NewsDialog`); `ProjectInformationPanel` marks the toggle element it
  renders, and `Toolbar` every button (the filter panels open from state). It works under jsdom, so a test can press Escape and expect the focus back, but that
  proves less than it seems: Tabster returns the focus only to the element it saw, and a list
  that remakes its rows (react-window given an inline row function, as the project list was)
  replaces that button while the drawer closes. A row component goes to `FixedSizeList` once,
  at module scope, with its data in `itemData` (`ProjectList/useProjectListRenderer.tsx`).
  Check the focus in the browser suite as well.
- An inline `outline: none` (the timeline items' configured style) beats a stylesheet's
  `:focus-visible` outline unless that outline is `!important`.
- A shape cut out with `clip-path` (the timeline's diamonds and triangles) takes no border: draw
  it in the edge's colour and lay the fill on top in a `::after` cut out by the same polygon
  scaled about the shape's centre (`Timeline.module.scss`). A drop shadow as the edge is thinner
  on the slopes than on the straight sides.
- A `brightness()` above 1 under the pointer fades an edge against its background and white text
  against its fill; darken instead (the timeline's `brightness(0.95)`). CSS `brightness()` scales
  the sRGB channels, so the hover colour can be measured as the colour times the factor.
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
