# Universal design (WCAG 2.1 AA), component by component

Status: proposed 2026-10-14, for the user's decisions (D1 to D4). Replaces the scope of
[#1527](https://github.com/Puzzlepart/prosjektportalen365/issues/1527), whose inventory dates from
May 2024; a new issue (draft in the session, Norwegian) carries the checklist below. Branches off
`releases/1.15` per slice, or off `releases/1.16` once it exists (D4).

## Goal and non-goals

Goal: every Prosjektportalen 365 component meets WCAG 2.1 levels A and AA in the UI it renders,
verified the same way for each (automated, keyboard, screen reader, visual, forms), with the result
written down per component, so a customer can answer for the portal in its own assessment. WCAG 2.2
adds six criteria at those levels; the four that touch our UI (2.4.11 Focus Not Obscured, 2.5.7
Dragging Movements, 2.5.8 Target Size, 3.3.7 Redundant Entry) are checked too, as "should".

Non-goals: SharePoint's own UI (the page chrome, list views, the command bar, the property pane,
the site settings), which Microsoft answers for; what editors write (news, page text, document
templates); the PnP controls' internals (reported upstream, worked around where we can); the
visual consistency items of the old issue (themes, design rules), which #1319 closed. Dead code is
not audited: `PortfolioWebParts/src/components/PortfolioInsights`, `ProjectProvision` and
`ProjectWebParts/src/components/ArchiveDialog` are imported nowhere (2026-10-14) and are deletion
candidates of their own.

## Why it matters (sourced, 2026-10-14)

- Norway's regulation follows EN 301 549 v3.2.1, which takes in WCAG 2.1; public bodies must meet
  WCAG 2.1's A and AA criteria (with exemptions for prerecorded and live audio and video, which the
  portal has none of) from 1 February 2023
  ([Uutilsynet: Kva seier forskrifta?](https://www.uutilsynet.no/regelverk/kva-seier-forskrifta/153)).
- Public bodies' intranets and extranets are covered when new or substantially revised after
  1 February 2023; "fagsystem", which take input from the user, are exempt, and Uutilsynet names the
  Office suite as one. Which a SharePoint project portal is, is the customer's case-by-case call
  ([Uutilsynet: Nettstad, intranett, ekstranett, app eller fagsystem?](https://www.uutilsynet.no/uubloggen/nettstad-intranett-ekstranett-app-eller-fagsystem/1557)).
- Procurement must take universal design into account in either case (FOA § 15-2, same page), so
  public-sector customers ask for it when they buy, and our customers are mostly public sector.

## What Fluent UI v9 gives us, and what is ours

Fluent v9's components carry their keyboard patterns, ARIA roles and states, focus handling
(`Dialog`, `OverlayDrawer`, `Menu`, `Popover`, `Combobox`, `TagPicker`, `TabList`, `DataGrid`),
visible focus indicators from the theme and forced-colors support. The 1.15 migration moved every
web part and extension to them, so much of WCAG's operable and robust criteria comes for free.

What stays ours, and where the static scan below points:

| Area | Criteria | Ours because |
|---|---|---|
| Names of icon-only buttons, inputs, regions | 1.1.1, 2.5.3, 4.1.2 | Fluent cannot know them; `strings` must supply them |
| Custom composites: matrices, timeline, phase selector, cards, the hub grid's groups | 1.3.1, 2.1.1, 4.1.2 | Built from `div`s and tables of our own or third-party code |
| Clickable `div`s | 2.1.1, 4.1.2 | Three found: `OverflowTagMenu`, `FilterPanel/Filter`, `DocumentTemplateItem`'s header |
| Our styles: colours, fixed heights, removed outlines | 1.4.3, 1.4.11, 1.4.12, 2.4.7 | 43 hard-coded colours in 16 style files; 32 fixed heights in 22; `outline: 0/none` in `EditViewColumnsPanel` (2) and `PackageDetails` |
| Status messages | 4.1.3 | Fluent's `MessageBar` announces itself through `useAnnounce`, which does nothing without an `AriaLiveAnnouncer` above it (`@fluentui/react-shared-contexts`' fallback), and no root of ours renders one: every `UserMessage` is silent to screen readers today. Live regions or toasts of our own exist in 7 components; searches, counts, loading and saves elsewhere say nothing |
| Headings and structure | 1.3.1, 2.4.6 | `WebPartTitle` is an `h2`; what sits under it is ours |
| Colour as the only carrier | 1.4.1 | Matrix cells, status indicators, phase colours |
| Forms: errors, required, suggestions | 3.3.1 to 3.3.4 | `CustomEditPanel` and the dialogs' own forms |
| Drag and drop | 2.1.1, 2.5.7 (2.2) | `EditViewColumnsPanel` drags with `@hello-pangea/dnd`, which moves by keyboard, and has move up and down buttons as the single-pointer alternative; the buttons are named by `title` alone |
| Timeline | 1.3.1, 2.1.1 | `react-calendar-timeline` 0.28 has no keyboard handling and no roles; it draws the shared `ProjectTimeline` and `ResourceAllocation`. The project timeline has a list beside it; the portfolio and program timelines and resource allocation have none |

## Inventory (from the code, 2026-10-14)

Level 1 is the web part or extension (its manifest); level 2 the surfaces it opens. Order within a
solution is the order of the slices below.

- **shared-library** (fixing a wrapper fixes every caller): `BasePanel`, `Toolbar` and
  `ListMenuItem`, `DataGridList`, `FieldContainer` with `CustomEditPanel`'s field elements
  (`DateField`, `PeoplePicker`, taxonomy, lookup), `FilterPanel`, `UserMessage`, `WebPartTitle`,
  `ConfirmDialog`, `OverflowTagMenu`, `ItemColumn` (16 renderers, `DialogColumn`'s dialog),
  `LoadingSkeleton`, `ProjectLogo`, `FileTypeIcon`, `Autocomplete`, `ColumnSearchPropertyField`,
  `ProjectTimeline` (`Timeline`, `DetailsPopover`).
- **ProjectWebParts**: Prosjektinformasjon (`Actions`, `AllPropertiesPanel`,
  `EditPropertiesPanel`, `CreateParentDialog`, `ProgressDialog`, `RunProjectSetupDialog`,
  `ParentProjectsList`, `ChildProjectsList`, `ProjectStatusReport`, `SustainabilityGoals`,
  `ArchiveStatus`), Fasevelger (`ProjectPhase`, `ChangePhaseDialog`), Prosjektstatus (`Header`,
  `Commands`, `SectionTabs`, `Sections`, `StatusElement`, `EditStatusPanel`, `SnapshotDialog`,
  `PublishedStatus`, `UserMessages`), Prosjekttidslinje (`TimelineList`), Risikomatrise and
  Mulighetsmatrise (`DynamicMatrix`: `MatrixRow`, `MatrixCell`), Prosjektnyheter (`RecentNews`,
  `NewsDialog`), Dynamisk liste (views, column menu, filter panel), `ProjectInformationPanel`.
- **ProjectExtensions**: ProjectSetup (`ProjectSetupDialog`: `TemplateSelector`,
  `ExtensionsSection`, `ContentConfigSection`, `ListHeaderSearch`, `MandatoryCheck`,
  `TemplateConfigMessage`; `ProgressDialog`, `ErrorDialog`, `@BaseDialog`), ProjectUpgrade,
  TemplateSelectorCommand (`DocumentTemplateDialog` and its five screens), RiskActionPlanner
  (`RiskAction`: the cell, the popover, `NewRiskActionPanel`, `MigrateRiskActionsDialog`).
- **PortfolioWebParts**: Prosjektutlisting (`ProjectList`: `Commands`, `ProjectCard`,
  `ProjectMenu`, the list view), Siste prosjekter, Porteføljeoversikt (`List` with `ListGrid`,
  `ListHeader`, `ColumnContextMenu`, `ColumnFormPanel`, `ViewFormPanel`, `EditViewColumnsPanel`,
  `ResultsCount`, `ToolbarItems`), Aggregert oversikt (the same parts), Prosjekttidslinje
  (portefølje), Ressursallokering, Idémodul (`Commands`, `IdeaField`, `IdeaPhaseBar`),
  Prosjektkort.
- **PortfolioExtensions**: Footer (`Assistant` with its iframe, `HelpContent`, `PromotedLinks`,
  `FavoriteProjects`, `SiteSettings`, `InstallVersion`, `Configuration`), IdeaRegistration,
  IdeaProcessing and IdeaProjectData (`IdeaDialog`, `IdeaApprovalDialog`), TemplatePackageCatalog
  (`CatalogToolbar`, `PackageList`, `PackageCard`, `PackageDetails`, `CompatibilityDialog`,
  `InstallProgress`).
- **ProgramWebParts**: Administrasjon av underområder (`ProjectList`, `Commands`,
  `AddProjectDialog`), Innholdsaggregering for program, Oversikt over underområder, Tidslinje for
  underområder.

## The audit of one component (definition of done)

1. **Automated, in the browser.** axe over the component and every surface it opens (WCAG 2.1 A
   and AA, 2.2 AA tags), scoped to our markup: no violation of impact serious or critical; the rest
   listed with a decision.
2. **Automated, in Jest.** jest-axe on the component's key states where it has component tests
   (names, roles, ARIA; `color-contrast` off, since jsdom has no layout).
3. **Keyboard.** Every action reachable and operable without a mouse, focus visible and in a
   logical order, no trap, Escape closes an overlay and focus returns to what opened it.
4. **Screen reader.** NVDA with Edge or Chrome on Windows, VoiceOver with Safari on macOS, on the
   Norwegian test hub: names, roles, states and values read as shown; status messages announced.
5. **Visual.** Zoom 200 % and reflow at 320 CSS px (1280 px at 400 %; data tables are exempt from
   reflow), text spacing (1.4.12), contrast (4.5:1 for text, 3:1 for large text and non-text),
   Windows contrast themes (forced colours), colour never the only carrier.
6. **Forms.** Labels tied to their controls, required marked, errors identified in text and
   announced, suggestions given, nothing asked twice.
7. **Recorded.** A row in the conformance overview (slice 7's document, started in slice 0):
   component, date, result per area, findings fixed or deferred with an issue. The component's
   checkbox in the issue is ticked with the commit or pull request.

Accessibility Insights for Web (Microsoft, free) runs axe as "FastPass" and walks through WCAG 2.1
AA by hand as "Assessment": the tool for steps 1, 3 and 5 when the browser suite does not reach a
surface.

## Decisions (proposed)

- **D1. Target: WCAG 2.1 A and AA must, the four 2.2 criteria above should.** The regulation names
  2.1; 2.2 is W3C's current recommendation and its additions are cheap where they apply to us.
- **D2. Tests ratchet per component.** axe runs in the browser suite from slice 0 in report mode
  (results attached to the run, nothing fails); a component's scope turns blocking (serious and
  critical fail the run) the day its audit is done, so the suite never goes red for work not begun
  and never lets a finished component slip back.
- **D3. Our own skill, `pp365-a11y`, not a vendored one.** Of the skills found (2026-10-14):
  Microsoft's `detecting-accessibility-issues` (`microsoft/vscode-documentdb`, MIT) has the best
  rules for React on Fluent UI (tooltip relationships, icon-only names, label in name, status
  announcements, group labels, decorative elements) but is written for that repository's own
  components; Deque's axe plugin (`dequelabs/axe-accessibility`, MIT) needs an axe DevTools
  subscription for its tools; AccessLint's `accesslint-audit` needs AccessLint's MCP tools, and its
  source repository carries no license; the generic WCAG skills (`wshobson/agents`,
  `addyosmani/web-quality-skills`, MIT) restate WCAG, which the model already knows. The repo's
  skill takes Microsoft's rules with attribution, rewritten for our wrappers (Fluent's `useAnnounce`
  for status messages, our strings for names), and adds what only this repo knows: the target, the
  audit above, the traps the audits find, and how to run and scope the tests. pp365-ui's
  "Accessibility of form fields" moves into it, pp365-testing gets the axe fixture and jest-axe.
- **D4. One new issue replaces #1527**, in Norwegian like its predecessor, with this inventory as
  its checklist; #1527 is closed with a link to it. Sub-issues per solution only if the list grows
  past what one issue carries.

## Slices and order

| # | Slice | Scope | Effort | Exit |
|---|---|---|---|---|
| 0 | Foundation | `pp365-a11y` skill (D3); `@axe-core/playwright` 4.13.0 (MPL-2.0) in `e2e` with a fixture that scopes axe to PP365 markup (`[data-sp-web-part-id]` of the channel under test, our dialogs and drawers) and attaches the report; `jest-axe` 11.0.0 (MIT) registered in `pp365-jest-config`; the baseline: axe over every page and surface the suite already opens, in report mode (D2); the conformance overview started in the guide | 2 days | Baseline report per component; skill passes `check-skills` |
| 1 | shared-library | First an `AriaLiveAnnouncer` in every root provider of ours (`Fluent`, `BasePanel`, `UserMessage`, `useConfirmationDialog`, ProjectExtensions' `@BaseDialog`), so `MessageBar` and `useAnnounce` speak; then the wrappers in the inventory's order, `ProjectTimeline` last: its keyboard and semantics are `react-calendar-timeline`'s, so the answer may be a list beside it, as the project timeline has | 3–4 days | Each wrapper's row recorded; its axe scope blocking |
| 2 | ProjectWebParts | Prosjektinformasjon, Fasevelger, Prosjektstatus, Prosjekttidslinje, the two matrices, Prosjektnyheter, Dynamisk liste, `ProjectInformationPanel` | 4–5 days | Per web part, as above |
| 3 | ProjectExtensions | ProjectSetup with its dialogs, «Hent dokumentmal», the risk actions, ProjectUpgrade | 2 days | Per extension |
| 4 | PortfolioWebParts | Prosjektutlisting with the cards, Siste prosjekter, Porteføljeoversikt and Aggregert oversikt with the hub grid and its panels (the drag and drop's alternative, D1), the two timelines, Idémodul, Prosjektkort | 4–5 days | Per web part |
| 5 | PortfolioExtensions | Footer with the assistant, the three idea command sets and their dialogs, Malpakkekatalog | 2 days | Per extension |
| 6 | ProgramWebParts | Administrasjon av underområder with its dialog, the aggregation, the overview, the timeline | 1–2 days | Per web part |
| 7 | Close-out | The conformance overview per WCAG 2.1 criterion (supported, partially, not, not applicable) linked from the release notes; changelog lines; the issue closed | 1 day | The overview published with the release |

Slices 1 to 6 go web part by web part, each a commit (or a small pull request) with its tests and
its row in the overview; a finding that needs a product decision (a timeline alternative, a new
control) is split out with an issue rather than holding the web part.

## Rules for the executing agent

- Read `AGENTS.md`, `pp365-a11y` (from slice 0), `pp365-ui` and `pp365-testing` first. Names and
  messages come from the loc triad, never literals; a fix to a shared wrapper goes in the library,
  not in the caller.
- Tests first: a missing name or a non-keyboard control gets a failing Jest or browser test before
  the fix. The browser suite reads only, as today; an audit that needs a write uses the flows'
  clean-up pattern.
- Screen reader and contrast checks are by hand: record what was checked, with which reader and
  browser, rather than claim a pass from axe alone: automated checks find only part of what WCAG
  asks.
- Never the developer's git; each batch ends with a commit message, `[apps-only…]` per what
  changed.

## Risks

- The timeline: `react-calendar-timeline` renders absolutely placed `div`s with no keyboard model;
  making it accessible in place may not be possible, and the equivalent list is a product decision
  for the portfolio timeline and resource allocation.
- SharePoint's markup around ours: axe scoped to our elements still sees SharePoint's ancestors for
  some rules (landmarks, headings); such findings are noted and left to SharePoint.
- The PnP controls (the taxonomy picker, the property pane controls) are Fluent v8 inside and
  outside our reach; their findings go to PnP's tracker.
- Theme colours: `customLightTheme` derives from the site's primary colour, which the customer
  picks; we check against SharePoint's default theme and a dark brand colour, and note the
  customer's share in the overview.

## Definition of done

Every component in the inventory audited and recorded, its axe scope blocking in the browser suite,
the conformance overview published with a release, the new issue closed.

## Slice log

### Slice 0 — Foundation (2026-10-14)

Issue #1788 replaces #1527 (closed by the user). Branch `feat/universal-design-wcag`, put in
`ci-channel-test.yml`'s push branches in this first commit, as the release skill says, to be
taken out in the pull request's last commit; `ci-build-debug.yml` covers `feat/**` already.

- **Skill** `pp365-a11y`: the target, what Fluent gives and what stays ours, fourteen rules for
  our code (Microsoft's `detecting-accessibility-issues`, MIT, adapted with attribution), the
  audit, the tests, recording, the traps. pp365-ui's "Accessibility of form fields" moved into it
  (rules 1 and 3); pp365-testing and AGENTS.md point at it. `check-skills` passes with eight.
- **Jest**: `jest-axe` 11.0.0 in `pp365-jest-config`, `lib/axe.js` with typings in `lib/axe.d.ts`
  so the solutions need no dependency of their own; requiring it registers the matcher, so only
  the tests that use it load axe-core. First use in `FieldContainer.test.tsx`: no violation with
  or without an icon, and a test that axe does find an input without a label (the matcher is not
  vacuous). 6 tests pass.
- **Browser**: `@axe-core/playwright` 4.13.0 in `e2e`; `fixtures/a11y.ts` (`scanAccessibility`,
  `WCAG_TAGS`, `A11Y_BLOCKING` empty, `SURFACES`, `FLUENT_INTERNALS`, `waitForContent`,
  `settleWebParts`), `channelWebPartsOnPage` in `fixtures/pp365.ts`, the page scans in
  `tests/smoke/a11y-baseline.spec.ts` (16 pages), the surfaces in the risk action and template
  dialog smokes. Report mode: annotations and `axe-<component>.json` attachments, nothing fails.
- **Baseline** (`.development-guide/spfx/tilgjengelighet.md`, new guide chapter): no violation in
  Prosjektinformasjon, Prosjektstatus, both matrices, Siste prosjekter, Porteføljeoversikt,
  Aggregert oversikt, Idémodul, the program's administration, aggregation; violations in
  Prosjektutlisting (aria-roles 36, critical, on the cards' avatars; link-name 5–7), Fasevelger
  (contrast of the phase names, a `ul` with other children), the three timelines (contrast of the
  items, the scroll region not focusable), Ressursallokering (a nameless skeleton),
  Oversikt over underområder (aria-command-name 24), «Hent dokumentmal» (target size, one
  contrast), the risk action panel's hint and the migrate dialog's field (contrast).

Found on the way:

- **Fluent's focus sentinels.** Tabster puts focusable `<i data-tabster-dummy>` hidden from
  assistive technology at the edges of focus groups; `aria-hidden-focus` flagged every toolbar,
  tag group and tab list. They pass focus straight on and are Fluent's; `FLUENT_INTERNALS` leaves
  them out of every scan.
- **Web parts mount late and lazily.** `openPage` waits for the first web part; the opportunity
  matrix came after. `settleWebParts` waits until the count has stood still for two seconds. Web
  parts below the fold mount only on scroll (the project home's news) and are scanned in their
  component's slice: scrolling made the program home fail, next item.
- **The program home's document list breaks the template command set.** Scrolled into view, its
  list loaded `TemplateSelectorCommand` (test channel id, registered at web scope as on the
  project), whose strings failed: "Could not load template-selector-command-set in require.
  Script error for 32f5eb06-…_1.14.0/ProjectExtensionsStrings", twice, the second time after the
  upgrade had finished. The project's library view loads the same command set fine. Not this
  plan's; reported to the user for an issue of its own.
- **The tenant under load.** A scan run while CI's upgrade ran hit the guard on a half-replaced
  bundle, and one while CI's e2e ran waited past 60 s for the project home's first web part; both
  passed when rerun.

### Slice 1, part 1 — The announcer and four wrappers (2026-10-14)

- **Every root speaks.** `renderReact` (`shared-library/src/util/reactRoot.ts`), which mounts
  every web part, extension, dialog and property pane field, wraps what it renders in Fluent's
  `AriaLiveAnnouncer`. Without one, `useAnnounce` falls back to a function that does nothing
  (`@fluentui/react-shared-contexts`), so every `MessageBar` (`UserMessage`) was silent. Two tests
  in `reactRoot.test.tsx`, seen failing without the announcer and passing with it: a status
  message announced after an action reaches a live region, which goes with the root, and a
  `UserMessage` shown after the mount announces itself. A message announced while the root first
  mounts waits in the announcer's queue (its live region is made in its own effect, after its
  children's), recorded as a trap in pp365-a11y.
- **LoadingSkeleton** names its progress bar «Laster...» (`strings.LoadingText`), the
  `aria-progressbar-name` the baseline found in resource allocation; a caller's name wins.
- **WebPartTitle** is one `h2`: the span inside it carried `role="heading"` as well, two headings
  to a screen reader. Fluent's `InfoLabel` named its info button "information" in English when its
  label is empty, as it is here: the button is now «Informasjon om <tittel>», and the tooltip names
  the web part instead of the description's HTML.
- **FilterPanel**: a filter's section header is a button with `aria-expanded` and
  `aria-controls`, where it was a clickable `div` the keyboard could not reach; a focus ring of
  Fluent's tokens, since our button draws its own.
- **The scanner waits for animations.** The contrast the baseline found in the risk action panel,
  the migrate dialog and the template dialog's footer was measured while Fluent faded them in;
  `waitForAnimations` before each scan, and those surfaces have no violation. The template
  dialog's target sizes stand.
- The static scan's three clickable `div`s were two: `OverflowTagMenu`'s wraps the menu to stop a
  click reaching the card, and is no control. Its tags are buttons that do nothing, a finding for
  the project cards.

Tests first: the five new tests (two in `reactRoot`, one each in `LoadingSkeleton`,
`WebPartTitle` and `FilterPanel`) failed on the old code and pass; jest-axe joined the
skeleton's and the title's tests. Changelog line under Forbedringer. Screen reader rounds for the
four are the user's (pp365-a11y, step 4): a filter section's state, the title read once, the info
button's name, «Laster...», and a message bar read aloud when it appears.

### Slice 1, part 2 — The other wrappers and the cell renderers (2026-10-14)

- **jest-axe in every wrapper with tests**: `BasePanel`, `Toolbar`, `DataGridList`,
  `useConfirmationDialog`, `CustomEditPanel` (also with the real date picker), `UserMessage`,
  `ProjectLogo`, `OverflowTagMenu` and the trend, link, person and file name cells. No violation in
  the first six; the panel is named by its header also while the header is hidden. `PeoplePicker`,
  `Autocomplete` and `ColumnSearchPropertyField` are tested on stand-ins for Fluent's combobox
  family, whose markup is not Fluent's: their names are asserted, and axe sees them in the browser.
- **OverflowTagMenu** (project information, the project list and cards, the idea module, the tags
  column): the tags were `InteractionTag`s, buttons that did nothing, in a `TagGroup`, which is a
  toolbar by default. They are `Tag`s now, each a `listitem` of a `TagGroup role="list"`, named
  by `text` when the caller gives one. The `+n` button is named «n flere elementer», and with the
  `MenuTrigger` around `InteractionTagPrimary` rather than around the tag's `div`, the menu's
  `aria-haspopup` and `aria-expanded` sit on the button that has focus.
- **An avatar beside a name** (`PeoplePicker`'s tags and options, `UserColumn` with one person)
  is `aria-hidden`: Fluent's `Avatar` is an `img` named by `name`, so the name was read twice.
  Several people in one cell keep their named pictures. The tag picker stand-in in
  `pp365-jest-config` renders `media` now, so a test sees the picture.
- **ConfirmDialog** is described by its content (`aria-describedby` on `DialogSurface`): Fluent
  names a dialog by its title and puts focus on the first button, so the question itself was not
  read as the dialog opened.
- **TrendColumn**: the icon is an `img` named «Målet er nådd», «Bedre enn forrige måling» or
  «Dårligere enn forrige måling» (three new strings), where shape and colour alone carried the
  trend. Its colours come from the benefit model in PortfolioWebParts: gold is 1.4:1 and the green
  2.9:1 against white, under the 3:1 of 1.4.11, left for the benefit overview in slice 4.
- **UrlColumn** rendered the column's description as the link's text, so a column without one
  showed an empty link (axe's `link-name`, and nothing to see or click). The text is the column's
  description, then the link's own, then the address, as the setting's help text says.
- **FileNameColumn**: a file name is a `Link` with `href`, `target="_blank"` and
  `rel="noopener noreferrer"`, where it was a transparent button calling `window.open`, so it is
  read and listed as a link and can be copied or opened where the user wants it.
- Noted, not changed: several people in one `UserColumn` cell show their names only in a tooltip
  on hover, with no way to it from the keyboard; `InstrumentColumn`'s gauge has no text
  alternative and colours its arc from red to green. Both with the views that use them (slice 4).

Tests first: ten tests in eight files failed on the old code (two each in `PeoplePicker`,
`FileNameColumn` and `UrlColumn`, one each in `TrendColumn`, `UserColumn`, `OverflowTagMenu` and
`useConfirmationDialog`) and pass. The library's 74 test files and its runtime tests pass, as do
the consumers' tests that render the changed parts: `RiskAction` in ProjectExtensions, and the
project list, the project cards and the idea module in PortfolioWebParts. Left in slice 1: the
timeline.

### Slice 1, part 3 — The timeline (2026-10-14)

`react-calendar-timeline` has no keyboard model, but it draws each item with our `itemRenderer`
and hands its scroll area to `scrollRef`, so most of what the risk above feared could be done in
place, in the library's `Timeline`, which all four timelines use (project, portfolio, program and
resource allocation).

- **The items are buttons** (`role="button"`, `tabIndex=0`, `aria-haspopup="dialog"`): Enter or
  Space opens the details, as a click does. A milestone, which shows no text, is named by its
  title. The details popover is named by the item, and Escape gives focus back to the item: the
  popover is positioned on the item, with no `PopoverTrigger` of Fluent's to return focus to.
  A `:focus-visible` ring wins over the `outline: none` in the items' configured style.
- **The scroll area** (`.rct-scroll`, axe's `scrollable-region-focusable` on every timeline) is a
  focusable `group` named «Tidslinjen. Rull i tid med piltastene», so the keyboard scrolls the
  time; checked against the real calendar under jsdom as well as the stand-in.
- **Contrast from configuration.** The hub template's colours put white text on #f35d69 (3.19:1),
  #2589d6 (3.73:1) and #249ea0 (3.24:1), all of axe's `color-contrast` findings on the timelines;
  the template's rows are `UpdateBehavior="Skip"`, so a fix in the template would reach no
  existing hub. `util/contrast.ts` measures contrast as WCAG does, and a bar's text keeps its
  configured colour where it reads 4.5:1 against the bar and is black or white where it does not.
  The resource allocation's bars, whose colours fade with the allocation, are measured the same
  way, blended over white. A milestone whose colour is under 3:1 against the timeline (the
  default yellow, 1.55:1, and the triangle's light blue) gets a one-pixel outline in
  `colorNeutralStrokeAccessible` (1.4.11), drawn as a shadow on a wrapper, since a shape cut out
  with `clip-path` takes no border.
- **Split out**: a list beside the portfolio, program and resource allocation timelines, as the
  project timeline has (`TimelineList`): a product decision (the plan's risks), drafted as an
  issue. Noted: a long timeline is many tab stops; the today marker is a line in colour alone.

Tests first: five tests in `Timeline.test.tsx` failed on the old code (the keyboard and the focus
return, the milestones' names, the scroll area, the text colour, the outline) and pass, with
`contrast.test.ts` beside them. The library's 75 test files and its runtime tests pass, and the
timeline tests of ProjectWebParts, ProgramWebParts and PortfolioWebParts' resource allocation. A
new smoke test opens a portfolio timeline item with Enter and checks the focus after Escape
against the real calendar on the test tenant; it passes once the change is deployed there.
Slice 1 is done but for the hand rounds (screen reader, zoom, contrast themes).

### Slice 2, part 1 — The phase selector (2026-10-15)

The baseline's `list` and `color-contrast` were the smaller part; a keyboard probe on the test
project found the larger: Enter on a phase opened its popover, but Tab from the popover's last
button went to the top of the SharePoint page and left the popover open, where Escape no longer
closed it.

- **The phases** are a list named «Prosjektets faser», each phase a `<button>` in its `li`.
  Fluent's `PopoverTrigger` had made the `li` itself a button (it applies `useARIAButtonProps`
  even with `disableButtonEnhancement`), which took the item's role (axe's `list`). The current
  phase is `aria-current="step"`, where its size and colour alone told it.
- **The popover** traps focus (`trapFocus`), so Tab stays in it and Escape gives focus back to
  the phase, and it is a dialog named by the phase's heading. Its sub text is a paragraph, not an
  `h4` under the `h2`. «Endre til denne fasen» is `disabledFocusable` on the current phase, so the
  reason in its title can be reached.
- **Contrast**: white on the default phase colours read 1.68 to 2.72:1; the old check for a light
  colour (perceived brightness over 200) never fired on them. The text colour is now chosen with
  `getContrastRatio` against every colour the phase takes, at rest and under the pointer: white
  where it reads 4.5:1 on all of them, otherwise black or white, whichever reads better on the
  worst. All the defaults get black; a dark custom colour keeps white. The focus ring takes the
  text's colour.
- **The change-phase dialog**: the comment field has a label («Kommentar»), where it had only a
  placeholder; the checkpoints are a list of steps with the current one marked, where they were
  tabs without panels that did nothing when chosen; the status buttons and «Hopp over» are
  `disabledFocusable`, so the keyboard reaches why they cannot be used and the focus stays while a
  status is saved; Escape closes the dialog except while the phase changes; the change is
  announced as it starts; in the summary each status icon is named by its status and the comment
  toggles say whether they are open; an archive section's header says whether it is open.

Tests first: four tests in `ProjectPhases.test.tsx` and eight in `ChangePhaseDialog.test.tsx`
failed on the old code and pass, with jest-axe over the list, the popover and the dialog's
views. The announcement test's first red run proved nothing (its helper read `textContent`,
which the announcer leaves empty under jsdom); with the helper fixed, it was seen failing with
the announcement switched off and passing with it. A new smoke test opens a phase with Enter,
tabs inside it and checks the focus after Escape, read only; it passes once deployed.

Found on the way: the test channel's release build had failed on the three pushes of slice 1.
`WebPartTitle`'s new markup (part 1) broke the status header's test in ProjectWebParts, which read
the description from the title's `title` attribute, and Rush then skipped the solutions that build
on ProjectWebParts, so nothing reached the test tenant after slice 0. The test reads the heading
and the info button now; every solution's suite passes locally (the library's 75 test files,
ProjectWebParts 46, PortfolioWebParts 37, ProjectExtensions 22, ProgramWebParts 10,
PortfolioExtensions 10), with no coverage floor missed. Recorded in pp365-a11y: a change to a
shared wrapper runs every solution's tests.

### Slice 2, part 2 — The project information (2026-10-15)

axe found nothing in the baseline; the audit found what axe cannot judge.

- **The properties** are a description list: each name a `dt`, its value the `dd`, where they
  were two texts in a `div` whose pairing only the eye could see (1.3.1). A person's picture is
  hidden beside the name: Fluent's `Persona` names its avatar, so the name was read twice; the
  project timeline's list had the same, also fixed.
- **Links where the action goes to a page**: «Vis versjonshistorikk» and «Administrer
  underområder», and every parent and child project, were buttons calling `window.open` or
  setting `location`; they are links (`Button as='a'`), and the projects are lists. The three
  sections inside the web part (parent projects, child projects, archive status) are `h3`
  under the web part's `h2`, through a new `headingLevel` on `WebPartTitle` (default 2).
- **The archive status** popover traps focus and is named, as the phase popover now is; its scope
  tags no longer colour their text by status (the warning's orange read 2:1): the status is the
  group's heading, and the icon keeps the colour.
- **Names**: the web part's own loading skeleton is «Laster Prosjektinformasjon...», and the
  spinners in the parent-project and rerun-setup dialogs say «Vennligst vent».
- Left for their own slices: `Persona` in the idea module's fields (slice 4) and in the Planner
  task item of the risk action (slice 3); the status report summary the web part embeds belongs
  to Prosjektstatus.

Tests first: nine tests (the actions, the properties, the timeline list, the web part and a new
`ArchiveStatus.test.tsx`) and one in `WebPartTitle` failed on the old code and pass. Every
solution's suite passes (the library 75 test files, ProjectWebParts 47, PortfolioWebParts 37,
ProjectExtensions 22, ProgramWebParts 10, PortfolioExtensions 10), no coverage floor missed.

### Slice 2, part 3 — The project status (2026-10-15)

axe found nothing in the baseline; what the audit found:

- **Headings**: the sections (Fremdrift, Økonomi, the lists, the uncertainties, the project
  properties) had no heading, so a screen reader's heading list had none of them; their status
  element now heads them as an `h3` (`asHeading`), its look unchanged. The report's state
  («Publisert …», `PublishedStatus`) was a second `WebPartTitle`, a second `h2` beside the
  title; it is a paragraph with the title's look.
- **A status shown by its icon alone** (`iconsOnly`, the project information's summary by
  default) was named by its section only («Fremdrift»), where the status is the point; it is
  named «Fremdrift: Grønn». Seen, it still tells the status by colour alone: the template's
  status icons are all `CircleFill` in green, yellow and red, the yellow at 1.9:1 (1.4.1, 1.4.11).
  A product decision, put to the user: per-value icons in the column configuration, the value as
  text under each icon, or the full status elements by default.
- **The project properties section**'s fields are a description list, as the project
  information's are.
- **The section tabs**: the overflow tab is named «n flere seksjoner», where «+2» told nothing;
  and whatever takes focus inside a section is kept clear of the pinned tabs
  (`scroll-margin-top` on the section's descendants, as on the section; 2.4.11).
- **The toolbar** (`shared-library`, every toolbar): a disabled item is `disabledFocusable`, so the
  arrow keys reach it and its description, which says why (no permission, a published report),
  is read; the status report's commands were the case.
- The tabs stay Fluent tabs that scroll to a section (an in-page navigation in a tab list), and
  the snapshot dialog, built this release, needed nothing.

Tests first: eleven tests failed on the old code (the status element's heading and icon name, the
sections' headings, the field list, the overflow tab, the toolbar, the report's headings) and
pass; three report tests and one program administration test changed with the intended toolbar
and markup changes. Every solution's suite passes.

The phase selector's push turned the test channel green again: the release build, the upgrade and
the browser suite passed, 72 tests where slice 0 had 70, the two new keyboard tests (the timeline
and the phases) among them. The integration job failed once on a program's risks fetched through
search (a data source error after 31 s), which none of this touches; rerun it.

### Slice 2, part 4 — The risk and opportunity matrices (2026-10-15)

axe found nothing; the matrices told what they hold to the eye alone.

- **A table**: the matrix was a grid of `div`s, so a screen reader read the headers and the
  elements' numbers in a row, with nothing to say which probability and consequence an element
  has. It is `role="table"` named by the web part's title, with `row`, `columnheader` (the top
  row, consequence), `rowheader` (the first cell of a row, probability) and `cell`; the look is
  the grid's.
- **The elements** were badges showing a number, their callout a tooltip under the mouse only.
  An element is now reachable by the keyboard (the tooltip shows on focus), named «7: <title>»,
  and described by the callout's text through a hidden copy (`aria-describedby`; the tooltip is
  `relationship='inaccessible'` so it is not read twice).
- **Before and after actions**: both positions were drawn, the one not shown at `opacity: 0`, so a
  screen reader read every risk twice, and a focusable element would have been focused unseen.
  The one not shown is `visibility: hidden` as well, transitioned with the opacity so the fade
  stays.

Tests first: a test of the table, the names and the description in `DynamicMatrix`, and the
hidden set in `RiskMatrix`, failed on the old code and pass. Every solution's suite passes.

### Slice 2, part 5 — The phase selector's colours (2026-10-16)

Part 1 let the code pick black text on the light default phases. A comparison of four variants,
drawn with the component's CSS and measured in the browser, showed one gap left: black on the
current phase under the pointer (#397e39) read 4.22:1. The user chose light phases with black text
and a dark current phase with white text over dark phases throughout:

| Level | Phase (black) | Under the pointer (black) | Current (white) | Current under the pointer (white) |
|---|---|---|---|---|
| Project | #89ce87, 11.2:1 | #54b054, 7.7:1 | #336f33, 6.1:1 | #2c5f2c, 7.6:1 |
| Portfolio | #9dceee, 12.5:1 | #64addb, 8.5:1 | #226894, 6.0:1 | #1e597f, 7.5:1 |
| End | #f0c993, 13.5:1 | #f09440, 9.0:1 | #994f0c, 6.0:1 | #83440a, 7.5:1 |

A phase not current took the current colour under the pointer; it has a colour of its own now
(`--phase-hover-color`), so the current phase can be dark while the others stay light. A phase in
the customer's own colour (`PhaseColor`) takes its current colour under the pointer as before;
whether such colours read is the customer's to judge, and the text picks black or white by the
contrast either way. The colour test was changed first and seen failing. The timeline faces the
same choice for its bars; not decided.

### Slice 2, part 6 — The status report's icons (2026-10-16)

The user chose the full view as the default where the project information shows the status report
(`statusReportShowOnlyIcons: false`), so the status is told in text and the default setup meets
1.4.1; the default lives in code only, so it reaches every page where no one chose otherwise.
Icons only can still be chosen; the property pane then says that it tells the status by colour
alone and does not meet the requirements. The icons looked soft: the catalog's unsized icons are
drawn on a 20 px grid and were shown at 18 px (the project information), 30 px (the report's
summary) and 50 px (each section); drawn at each size on a 1x and a 2x screen, 20 and 40 px were
crisp and the others blurred. They are 20 px in the project information and 40 px on the status
page. The SPFx stub in `pp365-jest-config` builds labels and sliders too, so a test reads them
from a property pane. Tests first (the default, the warning); every solution's suite passes.

### Slice 2, part 7 — The project news (2026-10-16)

Below the fold, so the baseline never scanned it. The news are a list (`role="list"` on the
cards' row, `listitem` on each card); «Vis flere» says whether more are shown (`aria-expanded`);
the separator between the author and the date is hidden from screen readers. The dialog for a new
article announces that it is being made and that it is made (`useAnnounce` in `useNewsDialog`),
where its content gave way to a spinner and a result in silence; an error already shows in the
title field's message, which Fluent reads. The title field and the template picker had fixed ids
(`news-title-input`, `template-dropdown`), so Fluent named them through `aria-labelledby` while a
click on the label no longer reached them, and two news web parts on a page would share ids; they
take the field's id now. «Opprett nyhet» lost an `aria-label` equal to its text and a `role` and
`tabIndex` the button has anyway. Tests first: the list test and the announcement test (a new
`useNewsDialog.test.tsx`) failed on the old code and pass.

### Slice 2, part 8 — The timeline's colours (2026-10-16)

Slice 1 left the timeline's text readable, but against the grey rows (`rgba(0, 0, 0, 0.05)` over
white, `#f2f2f2`) three of the template's four bar colours were under 3:1 (#f35d69 2.85:1,
#249ea0 2.90:1, #ff9933 1.90:1, and 2.13:1 against white too), and a bar's length is the period
it shows. Five variants were drawn with the timeline's CSS and measured in the browser (template
colours with white text, the branch's black text, darker colours with white text, a light tone
with a coloured edge, and the template's colours edged only where too faint). The user chose the
light tone with a coloured edge, and the milestones in the template's own yellow with a darker
edge of the same yellow.

- **Bars of the timeline configuration** (`elementType` Bar) are drawn in a light tone of their
  colour (40 % of it over white, `getTint`), edged by 1px in the colour itself, darkened just
  until it reaches 3:1 against the grey rows where it does not (`getContrastingShade`), with the
  text black where the configured colour does not read on the tone. All four template colours
  then give black text at 12.9–15.5:1 and an edge at 3.00–3.33:1 against the grey rows.
- **Milestones** (diamonds and triangles) are filled with their colour and edged in a shade at
  least a quarter darker that reaches 3:1 against the grey rows: the template's yellow `#ffc800`
  in `#ac8700` (3.02:1), the decision point's `#6495ed` in `#4b70b2` (4.40:1). A shape cut out
  with `clip-path` takes no border, so the edge is the shape in the edge's colour with the fill
  in a `::after` cut out by the polygon scaled about its centre, about 1.5px wide; the grey
  outline of slice 1 is gone. The triangle, drawn with CSS borders before, is a polygon now.
- **Under the pointer** the items darken (`brightness(0.95)`), where they brightened by 1.2,
  which faded the edges and would have dropped white text under 4.5:1.
- **The details' label** (`DetailsPopover`'s tag, in the item's colour) wrote white on any
  colour; it takes black where white is under 4.5:1.
- **Not changed**: the resource allocation's bars, whose colour fades with the allocation and
  has no `elementType`, keep their colour and only have their text chosen; their contrast
  against the rows belongs to slice 4. No template row changes, so nothing needs an upgrade step:
  the colours are drawn from whatever the hub has configured, the customer's own included.
  Noted: the project timeline's time-lapse marker is a line in `#f35d69`, 2.85:1 against the grey
  rows.

Tests first: the tone and the edge of a bar, the milestones' edges and the details' label failed
in `Timeline.test.tsx` on the old renderer, as did the three new tests of `getTint` and
`getContrastingShade` in `contrast.test.ts` (against stubs); all pass, and the allocation's
colours are pinned by a test that passed before and after.

### Slice 2, part 9 — The dynamic list (2026-10-16)

No page on the test hub holds the web part, so the baseline never scanned it and axe ran in Jest
only. What the audit found:

- **Focus dropped to the page's start** whenever the view changed (2.4.3): the link that opened
  an item or a folder left the page with the view, and the refresh button was swapped for a
  spinner while the list was fetched again. `useNavigationFocus` gives an opened item's heading
  the focus (its fields where the title is hidden), an opened folder the breadcrumb's current
  crumb, and on going back the link of the item or folder left; the toolbar stays while the list
  is fetched again. The back button's state change is `utils/navigation.ts`'s `goBack`, so the
  test runs the real one.
- **Silent results** (4.1.3): an upload, a new document and a deletion said nothing when done
  and nothing when they failed, the error going to the console only; a deletion's failure was
  not even caught. Each says what it did, or why it did not, in a toast (`useNotify`), seen by
  all and read through the toaster's live region. A drop on the library and the toolbar's upload
  share one upload (`useFileUpload`), where each had its own. A search or a filter tells how many
  items it shows, half a second after the last keystroke, against the folder's count in a
  library; the refresh tells when the list is updated.
- **A fetch error** showed as «Error: …» in a bare `div`, English and unannounced; it is a
  `UserMessage` titled «Feil». The search box's placeholder fell back to a literal «liste».
- **The export button** was named «3» when three items were selected: its text is the count,
  and the toolbar names an item with text by its text. `ListMenuItem.setAriaLabel`
  (shared-library) names it «Eksporter 3 valgte elementer til Excel», holding the count, in
  every toolbar where an item's text alone does not say what it does.
- **The single item view**: the title was an `h1` under the web part's `h2`; it is an `h3` with
  the same look. The fields were name and value in `div`s; they are a description list. Its
  columns were at least 450px wide in a container that hides what overflows, so at 320px the
  values were cut off (1.4.10); one column now when the web part is narrower.
- **Names**: the title's skeleton beside the list's while loading was a second, unnamed progress
  bar (axe's `aria-progressbar-name`); it is hidden. The custom action dialog's spinner is named
  «Vennligst vent...».
- Noted, not changed: the column header's right-click sets a menu that nothing renders, so there
  is nothing the keyboard misses; column widths change by mouse only, while every value shows in
  full in the single item view; the rows carry `aria-selected` in a `table`, which axe accepts
  and the row's check box says anyway; the upload zone's card variant is used nowhere.

Tests first: seven tests in `DynamicList.test.tsx` (the heading and the field list, the loading,
the focus after opening and going back for an item and a folder, the toolbar kept through a
refresh and its announcement, the search count, the error) and five in a new
`useToolbarItems.test.tsx` (a new document, a deletion and an upload told, the export button's
name, the spinner's name) failed on the old code, as did the new test in shared-library's
`Toolbar.test.tsx`; all pass. The folder's focus test failed there on `DEBUG`, which SPFx defines
at build and the library's view reads, before it reached its assertion; the test defines it now,
and was not run against the old code again.

### Slice 2, part 10 — The project information panel (2026-10-16)

The panel the project cards and the portfolio lists open is the library's `BasePanel` around
`ProjectInformation`, both audited, and jest-axe finds nothing in it. One finding: closing it left
the focus on the page's start (2.4.3). Fluent's drawer returns focus through Tabster's restorer,
only to an element marked as a restore target, which `DialogTrigger` would mark; the panel opens
from state. The toggle element `ProjectInformationPanel` renders (the portfolio lists' title and
project information columns) is now cloned with `useRestoreFocusTarget()`, and the project card's
button (`ProjectCardFooter`, PortfolioWebParts, for the project list and the project card web part,
which open the panel through `hidden`) carries it. The flow test that opens the panel from a card
scans it with axe and expects the focus back on the card's button after Escape. Noted for slice 4:
that button has the same text in its `title` and its tooltip, read twice.

Tests first: the focus test in `ProjectInformationPanel.test.tsx` and the restore target in
PortfolioWebParts' `ProjectCard.test.tsx` failed on the old code and pass. Slice 2 is done but
for the hand rounds.

The browser test then failed on the test hub: the button carried the restore target and was in
Tabster's history, but the focus stayed on the page's start. A probe on the hub showed the
button gone from the page 387 ms after Escape and a new one in its place: the project list gave
`FixedSizeList` an inline function as its row, a new component on every render of the list, so
every row and card was made anew whenever its state changed, the panel opening and closing among
them, and Tabster found only a detached button to return the focus to. The row is a component of
its own (`ProjectRow` in `useProjectListRenderer.tsx`), given its projects through `itemData`,
and the cards are keyed by their site; a test in `ProjectList.test.tsx`, the card view on a
stand-in `AutoSizer`, failed on the old code (the button detached after the click) and passes.

### Slice 3, part 1 — The project setup (2026-10-16)

The setup dialog shows on a new site only, so the baseline never scanned it; axe ran in Jest over
the dialog, its two sections, the progress dialog and the error dialog, and found nothing in the
base dialog or the error dialog. What the audit found:

- **The template picker**: the choice between no template and a template (`RadioGroup`) had no
  name; it is «Mal på området». A cloud template's reading and its end were silent, the setup
  button turning usable without a word; both are announced, and a failure is a message as before.
- **The sections' tabs**: the sections were not tied to their tabs; the content is the tab panel
  (`role="tabpanel"`, `aria-labelledby` the tab). A tab's count badge was a bare number; a tab
  with a count is named «Prosjekttillegg, 2 valgt». A disabled tab keeps its reason in a tooltip,
  which the keyboard does not reach and a screen reader gets as its description: noted.
- **The sections**: the search boxes had a placeholder and no name; a search tells how many items
  it leaves (`useSearchAnnouncement`, half a second after the last keystroke). The count of picked
  items was a disabled toolbar button, read as «3 valgte elementer, button, unavailable» since the
  toolbar's items became `disabledFocusable`; it is a `status`, read when it changes. The lock on
  an item that cannot be left out was a `span` named by its tooltip; it is an `img`. The Norwegian
  lock text said «Prosjekttilegget»; spelt right.
- **The progress dialog**: each step is announced as it starts («Steg 3 av 9: …»), where the bar
  and the step count changed in silence. The advanced log's toggle says whether the log is shown
  (`aria-expanded`, `aria-controls`). Each step in the log is named by its status and its entries
  («SitePermissions: fullført (2 i loggen)»), which an icon and a colour showed alone (1.1.1,
  1.4.1); the running step's spinner was an unnamed progress bar. Each entry's level is named,
  and the entries are a `log` the keyboard reaches to scroll. The status icons take Fluent's
  colours (the warning's #ffaa44 was 1.9:1), and «Venter» the grey that reads 4.5:1 (#8a8886
  read 3.5:1).
- **Hidden messages read out**: «Prosjektdata funnet» sat in a `hidden` container on every setup,
  and the error dialog kept a hidden message bar with the stack beside the stack as subtext. A
  `MessageBar` announces itself when it mounts, hidden or not, and an announcement made while the
  root mounts waits for the next one: the setup's came out when a cloud template was read. Both
  render only when they apply.

Tests first: fourteen tests across the setup dialog, both sections and their hooks, the progress
dialog and the error dialog failed on the old code and pass; the tests' announcer helper reads
the newest message, the last span, since jsdom ignores the announcer's clearing. ProjectExtensions'
22 test files pass.

### Slice 3, part 2 — The project upgrade (2026-10-16)

`ProjectUpgrade` renders nothing: its `onInit` returns at once, and the upgrade runs from the
installer (its test says so). There is nothing on the page to audit. The component overview still
called it a dialog; it says what it does now.

### Slice 3, part 3 — «Hent dokumentmal» (2026-10-16)

The baseline's `target-size` findings, 2 in the template step and 3 in the target folder step,
were the folders' names: a `Link` with 16px of text in the name column, beside the row's check
box or radio. They are a `FolderLink` at least 24 by 24 px. What else the audit found:

- **The folder trail** had no name; it is «Mappenavigasjon». Opening a folder from either list
  dropped the focus to the page's start, as the link left with the list; going up from the trail
  did the same. `useFolderFocus` gives an opened folder's trail step the focus, and on going up
  the link of the folder left, looked for again for a while, since `DataGridList` draws its rows a
  render after the screen and the target step reads its folders from SharePoint; it leaves the
  focus alone if the user has moved it. Switching library in the target step moves no focus:
  noted.
- **Each copy's header** was a clickable `div`; it is a button that says whether the fields are
  shown (`aria-expanded`, `aria-controls`), with the look it had. The name and title fields set
  ids of their own, which the hook told them apart by, so Fluent's `Field` named them through
  `aria-labelledby` and a click on «Filnavn» or «Tittel» reached nothing; each field has its own
  handler now and keeps the field's id.
- **The copy** tells each file as it starts («Kopierer Prosjektplan.docx»), where the bar and the
  name changed in silence; the summary was a message already.

Tests first: the trail and the focus in `SelectScreen.test.tsx` and `TargetFolderScreen.test.tsx`,
the header button and the label clicks in `DocumentTemplateItem.test.tsx`, and a new
`CopyProgressScreen.test.tsx` failed on the old code and pass. The target size is CSS; the browser
suite's scans of both steps will tell. ProjectExtensions' 23 test files pass.

### Slice 3, part 4 — The risk actions in Planner (2026-10-16)

axe found nothing in the baseline, in the cell, the popover, the panel or the migration dialog.
What it cannot judge:

- **«No actions»** in a risk's cell was an info `MessageBar`, which announces itself as it mounts:
  a field customizer renders one per row, so the risk list read out «no actions» for every risk
  as it loaded. It is a button with the message's look, which opens the actions as before.
- **The Planner tasks** are a list named «Tiltak i Planner»; a done task, struck through to the
  eye, says so in its name («…, fullført»). Its preview keeps the focus (`trapFocus`), is named
  by the task, reads the people once (the `Persona`'s avatar hidden, as in the project
  information), gives its properties as a description list, and «Åpne i Planner» is a link with
  `href`, where a button called `window.open`.
- **The actions' popover** keeps the focus and is named by its title. Its hidden «last
  synchronised» message bar was announced on every open; it renders only when shown. The
  synchronisation, a new action and the migration said nothing when done, and their failures
  were not caught: each says what it did, and a failure shows in a message where the action was
  made (the popover, the panel, the dialog). The migration's buttons stay while it runs,
  `disabledFocusable`, where they were removed with the focus on one, and its bar is named.
- **«Administrer»** sat at opacity 0.2 (its text 1.3:1) until the pointer came, and stayed so
  with the focus on it; it shows on hover and on focus, and always without a hovering pointer.
- The browser test found the panel and the migration dialog as «the» dialog; with the popover a
  dialog too, it finds them by name. A probe with the real Popover and Dialog showed a dialog
  opened from a focus-trapping popover taking the focus and giving it back on Escape, as without.

Tests first: seven new tests and two changed ones in `RiskAction.test.tsx` (the popover stand-in
now carries `trapFocus` and the surface's name, as Fluent does) and one in
`PlannerTaskItemProperty.test.tsx` failed on the old code and pass. ProjectExtensions' 23 test
files pass. Slice 3 is done but for the hand rounds.

### Slice 4, part 1 — The project list and its cards (2026-10-16)

- **`aria-roles` 36 (critical)**: the data adapter gives each person the field's internal name as
  `role` (`createUserPersona`), and the cards' footer and the list view spread the person onto
  `Avatar`, so every picture had `role="GtProjectOwner"` or `role="GtProjectManager"`. The cards
  name the picture by the role and the person («Prosjektleder: Kari Nordmann», which only a
  tooltip on hover told before); the list view hides it beside the name it shows.
- **`link-name` 5–7**: the card's logo link took its name from `ProjectLogo`, which is empty
  while the logo loads, hence the count that changed between runs. It is named by the project,
  and beside the title's link to the same page, shown over a custom logo, it is left to the
  pointer (`aria-hidden`, `tabIndex -1`). The list view's logo is hidden beside the title's link.
- **The card's other parts**: the project type was a subtle button that did nothing; it is an
  image named by the type and the template. The phase badge showed its first letter; it is an
  image named «Fase: Konsept». The panel button had the same text as its `title` and its tooltip's
  description, read twice; the tooltip is its label.
- **The quick launch menu** (the card's and the list's `ProjectMenu`) put each link inside a
  `MenuItem`, which takes the focus and did nothing on Enter, so the keyboard could open none of
  the project's pages; the items are `MenuItemLink`s.
- **The commands and the selections**: the overflow tab «+3» is named «3 flere utvalg»; the
  projects are the selected tab's panel; the view mode button, named «Kort» by the mode it shows,
  is «Kort, visningsmodus» (`setAriaLabel`); a search tells how many of the selection's projects
  it shows, half a second after the last keystroke.
- Done with the project information panel (slice 2, part 10): the cards were remade on every
  render of the list.

Tests first: three new tests in `ProjectList.test.tsx`, one in `List.test.tsx` and a new
`ProjectMenu.test.tsx` failed on the old code and pass; three tests changed with the intended
markup (the phase badge, the panel button and the list's logo, found by role, name or wrapper).
The test of the selections, the view mode button and the search took over five seconds by roles
under a full run's load; it is two tests now, on selectors, after it had failed on the old code
as one. PortfolioWebParts' 38 test files and ProgramWebParts' 10 pass.

### Slice 4, part 2 — The latest projects (2026-10-18)

axe found nothing. The projects were `div`s; they are a list named by the web part's title. Each
project's logo, an image named «Prosjekt: …» beside the link with the project's name, read it
twice; it is hidden. «Vis flere» says whether the rest are shown (`aria-expanded`) and lost a
`title` equal to its text. Tests first: the new test in `LatestProjects.test.tsx` failed on the
old code and passes.

### Slice 4, part 3 — The portfolio overview, part 1: the list and its columns (2026-10-18)

axe found nothing in the baseline. The hub's grid (`ListGrid`, which the aggregated overview and
the program administration share) was rebuilt on Fluent's `Table` in the migration with a grid's
roles, arrow keys and named checks. What the audit found:

- **The column headers** open the column menu, but said nothing of it; with `headerOpensMenu`
  (the hub's, not the program administration's, whose headers sort) they carry
  `aria-haspopup="menu"` and are marked as Tabster's restore target: the menu opens from state, at
  the header, with no trigger of Fluent's, so closing it, or a panel it opened (the column form),
  left the focus nowhere. The expand-all button had the same text as name and title, read twice;
  its tooltip names it. A group's cell spans the row (`aria-colspan`).
- **The results count** («Viser 10 av 42») is a `status`, read as a search, a filter or the load
  changes it.
- **«Vis eller skjul kolonner»**: a row is the drag handle the keyboard lifts with space, with
  `outline: 0` and no focus style; it shows its focus. The move buttons showed only on `:hover`,
  `display: none` otherwise, so the keyboard could not reach the way to move a column without
  dragging; they show while the focus is in the row. They were named by `title` alone, «Flytt opp»
  in every row, and `disabled` with their reason in that title; they are «Flytt Tittel opp»,
  `disabledFocusable` with the reason as title, and a move tells where the column went. The
  drag-and-drop library's handle instructions and announcements were English; they are the
  strings' (`dragHandleUsageInstructions`, the responders' `announce`).
- Part 2 (below): the column and view forms and the toolbar.

Tests first: two tests in `ListGrid.test.tsx` (one a guard that a sorting header stays plain,
which passed before), one in `ResultsCount.test.tsx` and two in `EditViewColumnsPanel.test.tsx`
failed on the old code and pass; the move test changed with the buttons' names.


### Slice 4, part 4 — The portfolio overview, part 2: the forms and the toolbar (2026-10-18)

- **The toolbar's selectors** were named by what they showed, «Alle prosjekter» or the
  portfolio's name, and said nothing of what they choose. They keep that text first (2.5.3) and
  add their purpose through `ListMenuItem.setAriaLabel`: «Alle prosjekter, Porteføljevisninger»
  (`SelectorButtonLabel`, `'{0}, {1}'`). The export and filter buttons were named already.
- **The view form**: the warning that a default view is set sat inside the default view's field,
  which is `hidden` for a personal view, and a message bar announces itself when it mounts,
  hidden or not; it was read on every opening. It is rendered only while the field shows.
- **The column form**: every control is in a `FieldContainer` with label and hint, the required
  fields are marked, and a save error is a message bar, which announces itself. Nothing to fix.
  Both forms disable «Lagre» until the required fields are filled (two characters or more in the
  column form), and those fields are marked; left as it is.

Tests first: the new names in `usePortfolioSelector.test.ts` and `useViewSelector.test.ts`, and
the hidden warning in the new `ViewFormPanel.test.tsx`, failed on the old code and pass; the
other test in that file, the warning shown for a shared view, is a guard that passed before.
`PortfolioOverview.test.tsx` finds the view selector by its new name.

### Slice 4, part 5 — The aggregated overview, and the hub's cells (2026-10-18)

The aggregated overview renders the hub's `List`, so part 3's fixes are its own. Its forms are
like the overview's: labelled, required fields marked, a save error a message bar. What was left:

- **The view selector** was named by the view alone; it adds what it selects, as the overview's.
- **The cells** noted in slice 1, «with the views that use them»:
  - `TrendColumn`: the icon's colour must reach 3:1 against the row's faintest background (white,
    about `#f2f2f2` when hovered or selected). Gold reached 1.25:1, green 2.6:1. An icon under 3:1
    is framed: the regular icon, which is the filled one's outline, is drawn over it in
    `getContrastingShade` of its colour (`#a38a00`, `#24a058`), so the colour stays; red reaches
    3.4:1 and is drawn as before. `BenefitMeasurement` gave the gold as `'gold'`, which
    `parseColor` cannot read; it is `#ffd700`.
  - `UserColumn` with several people showed their names only in tooltips on hover. Each picture
    takes the focus (an arrow stop in the hub's grid, whose Tabster grid navigation keeps them off
    the Tab sequence), so its tooltip shows to the keyboard; the `title` beside the tooltip, a
    second, native one, is gone.
  - `InstrumentColumn`: the gauge is a drawing with no text alternative; it is an `img` named by
    «Siste måling 30, startverdi 10, målverdi 50» (`Aria.InstrumentGaugeLabel`). The popover held
    no control, so the focus stayed on the link and a screen reader heard nothing open; with
    `tabIndex={-1}` on the surface Fluent focuses the surface, and `trapFocus` keeps it there
    until Escape gives it back. It is named by the indicator (or the column) and described by the
    gauge's text and the unit, from one hidden text: `dom-accessibility-api`, which Testing
    Library computes descriptions with, leaves out a referenced `aria-label`. Its arc still runs
    from red to green; the values are in text.
- **The project cards** had the same tooltip-only text: the people, the phase and the type. They
  take the focus too, with a focus outline.
- Noted: the forms show category and level as disabled fields, and «Slett» is disabled for the
  title column with no reason given.

Tests first: the view selector's name in `useToolbarItems.test.tsx`, the edge in
`TrendColumn.test.tsx`, the measurable gold in `BenefitMeasurement.test.ts`, the people in
`UserColumn.test.tsx`, the card's markers in `ProjectList.test.tsx` and both tests in the new
`InstrumentColumn.test.tsx` failed on the old code and pass. The trophy's colour in the benefit
test changed with the hex.

### Slice 4, part 6 — The portfolio timeline (2026-10-19)

The web part renders the library's `ProjectTimeline` and nothing of its own; slice 1 made the
items buttons, the scroll area a stop for the keyboard and the colours readable. Two things were
left, both in the library, so all four timelines and every toolbar have them:

- **The details** of a milestone or a phase hold no link, so Fluent's popover, which focuses the
  first control in it, left the focus on the item behind, outside the trap, and a screen reader
  heard nothing open. With `tabIndex={-1}` on the surface Fluent focuses the surface, link or
  none, and it is described by its content (`aria-describedby`), so the dates are read as it
  opens. The test's surface stand-in passes on its props now.
- **The filter panel** opens from a toolbar button through state, with no `DialogTrigger`, so
  Tabster had no restore target and closing it left the focus at the start of the page. `Toolbar`
  marks every button it renders with `useRestoreFocusTarget()`: the portfolio overview's, the
  aggregated overview's, the dynamic list's and the timelines' filter panels, and any panel or
  dialog a toolbar button opens. Menu items are Fluent's triggers already.
- The browser suite checks both: the details take the focus, and closing the filter panel of the
  timeline and of the benefit overview gives it back to the button.
- Still split out: a list beside the timeline (the plan's risks). Noted: the today marker is a
  coloured line with no text; a project's name shows two tooltips under the pointer, its `title`
  and Fluent's.

Tests first: the restore target in `Toolbar.test.tsx` and the details' focus and description in
`Timeline.test.tsx` failed on the old code and pass. The browser checks run in CI after the
test-channel upgrade.

### Slice 4, part 7 — Resource allocation (2026-10-19)

axe's `aria-progressbar-name` was the loading skeleton, named in slice 1, and the timeline's
keyboard, text colours, details and filter panel are the library's (slice 1 and part 6). Left was
what the plan called its bars: the fill is the configured colour at the allocation's opacity,
never under 0.3, so a bar of 30 % is 1.3:1 against the grey rows and its extent hard to see
(1.4.11). The share stays in the fill, and in the bar's text.

- A bar from elsewhere than the timeline configuration may name an edge colour,
  `data.edgeColor` (`ITimelineItemData`); the timeline edges it in that colour, darkened by
  `getContrastingShade` where it stands out too little from the rows, with the line height
  less the edge, as a configured bar. Without one a bar is drawn as before.
- The resource allocation names its full colour (`rgb(itemColor)` or `rgb(itemAbsenceColor)`):
  the default green (3.27:1) and blue stand out by themselves, a paler configured colour is
  darkened. The edge shows the bar's whole extent, the fill how much of it is allocated.
- `transformItems` is exported for its test.

Tests first: the edge in `Timeline.test.tsx` and the new `useResourceAllocationDataFetch.test.ts`
failed on the old code and pass; the test that a bar from elsewhere without an edge colour is
not edged passes as before.

### Slice 4, part 8 — The idea module (2026-10-19)

axe found nothing in the baseline, which scanned the overview, the aggregated overview's list.
The idea view and the navigation had what it cannot see:

- **The menu button** (Fluent's `Hamburger`, which has no name of its own) was named by a tooltip
  «Navigation» inside another, «NavigationMenu», both literals in English. It is named
  `Idea.NavigationMenuLabel`, says whether the menu is open (`aria-expanded`), and, since the
  menu's button goes with the menu and the one beside the content comes as it closes, a toggle
  gives the focus to the button that takes the other's place; it fell to the page's start.
- **The phase bar** was a `TabList`: tabs that did nothing, the phases other than the current
  disabled (`colorNeutralForegroundDisabled`, 1.9:1) and a nameless disabled tab between each,
  three of the names Norwegian literals. It is an ordered list named `Idea.PhasesLabel`, the
  current phase `aria-current="step"`, drawn as the tabs were (icon and name, the current one
  underlined in the brand stroke and semibold), the others in `colorNeutralForeground3` (6.2:1),
  the chevrons hidden. `role="list"` stays explicit: Safari drops the role of a list without
  markers.
- **Headings**: the idea's title was an `h1` under the page's own; it is an `h2`, as a web part's
  heading is, and «Status» an `h3` from the strings, sized as the `h2` it was.
- **Fields**: each is a name and value pair in a description list (`dt`, `dd`), the containers
  `dl`s. A person (`User`, `UserMulti`) was spread onto `Persona` with its every key, so its
  login name became the element's `id` (twice where one person shows twice); the props are
  picked, and the picture beside the name is hidden.
- The error title «Ingen idé funnet» was a literal; it is `Idea.NoIdeaFoundTitle`.

Tests first: two new tests in `IdeaModule.test.tsx` (the menu button and the focus; the idea's
headings and phases) and the new `IdeaField.test.tsx` failed on the old code and pass.

### Slice 4, part 9 — The project card, and slice 4 done (2026-10-19)

The project card web part renders the project list's card for one project, with the project
information panel: what part 1 and part 5 fixed on the card is its own, and its test already
checks the focus back from the panel. Nothing of its own to fix. Noted: it shows nothing while
it loads, and nothing when the fetch fails (`useProjectCardDataFetch` catches no error), the
latter a fault for everyone rather than for universal design.

Slice 4 is done but for the hand rounds: the project list and its cards, the latest projects,
the portfolio overview and the aggregated overview with the hub's grid, panels and cells, the
portfolio timeline, resource allocation, the idea module and the project card.
`PortfolioInsights` and `ProjectProvision` are dead code, not audited.

### Slice 5, part 1 — The footer (2026-10-19)

The footer (PortfolioExtensions' application customizer) was not in the baseline: it shows on
every hub page but no scan scoped to it. Its test (`Footer.test.tsx`) renders it whole with
stand-ins for Fluent's popovers and menus, now passing their surfaces' props on, marking a focus
trap, and calling a trigger's render function as Fluent does.

- **Minimized**, the footer was `opacity: 0` and 12px high but on `:hover`, so the keyboard worked
  in it unseen (2.4.7); it shows on `:focus-within` too.
- **The assistant's drawer** had `role='panel'`, no ARIA role at all; it is the drawer's dialog,
  named by its title. Its header's icon buttons were named by `title` alone; they have
  `aria-label`s. The settings, a list, are a link for site admins, where others had a disabled
  button with no reason. The drawer opens from state, so the assistant's button is the restore
  target.
- **Links**: the site settings, the site contents, the configuration page, the installation log,
  the GitHub release, its notes (a `Link` with no `href`, so a button), the download, the useful
  links and the help's resource link were buttons calling `window.open`; they are links
  (`Button as='a'`, the split button's `primaryActionButton={{ as: 'a' }}`, `MenuItemLink`).
- **The site settings' split button**: `MenuTrigger` went round a tooltip round the whole split
  button, so the menu's state landed on its frame, and its menu button, unnamed, took the
  settings' name; the trigger hands its props to `menuButton`, named «Flere valg for området»,
  and the description goes on the link through the slot's render function.
- **The useful links' tooltip** held a link to the links list, out of the keyboard's reach; the
  tooltip is text, and the list is the menu's last item.
- **The favourite projects and the installation** popovers hold links: `trapFocus`, named.
- **The help dialog** had no title, so no name, and no close button; it has both. Each tab is tied
  to its panel (`tabpanel`, `aria-labelledby`). The help button, unavailable with no help, is
  `disabledFocusable`, so its description says why.
- **GitHub's version comparison**: the older-version icon was CSS orange, 2:1 against the
  popover; the icons are Fluent's green, warning orange and foreground, hex (`parseColor` reads no
  names). The release's highlights scroll and are a stop for the keyboard; they are a named
  region.

Tests first: eight tests in `Footer.test.tsx` and the new colour test failed on the old code
and pass; the tests that clicked through `window.open` changed with the links, and the
comparison test reads the colours from the defaults.

### Slice 5, part 2 — The idea extensions, skipped (2026-10-19)

IdeaRegistration, IdeaProcessing and IdeaProjectData (`IdeaDialog`, `IdeaApprovalDialog`) are
not audited: they are to be deprecated (decided 2026-10-19), so their rows say so and #1788's
boxes for them are left out rather than ticked. The idea module web part (slice 4, part 8) is
not affected.

### Slice 5, part 3 — The template package catalog (2026-10-19)

The catalog (the template options list's command set) was not in the baseline. A new test,
`TemplatePackageCatalog.test.tsx`, renders its parts under a context stand-in, with the parts of
the details that fetch stood in for.

- **The cards** were `listitem`s with `aria-selected`, which a list item does not take (axe's
  `aria-allowed-attr`), focusable and chosen by click or Enter: read as list items, never as
  something to choose. The cell is the `listitem`; the card is a `button` named by the package,
  described by its description, the chosen one `aria-current`.
- **The toolbar** was `role='toolbar'`, which promises one stop and the arrow keys, around a
  search box, lists and a switch, named as the drawer; it is a `search` named
  «Søk, filtrer og sorter malpakkene». The view buttons' group was named «Rutenett», as one of
  its buttons; it is «Visning», the buttons named by their tooltips alone.
- **The details** took the focus on their frame, with no name and its outline removed; the
  package's name is an `h3` that takes it. The actions were `disabled` while one ran and the main
  one when the package is unsupported, so the keyboard lost the focus and never reached the
  reason; they are `disabledFocusable`.
- **The installation** replaces the details, whose button started it, and is replaced by them as
  it closes: it is a region named «Installasjon av …» that takes the focus as it mounts (both of
  its states render the same root, so the focus stays as the steps arrive), and closing it sets
  `focusDetails`, which hands the focus to the package's heading. A retry keeps the focus in the
  region. The progress bar is named, each step's status icon is an image named by the status (a
  name on a plain span is not read), the log's toggle has `aria-expanded` and `aria-controls`,
  and each step is announced as it starts.
- **The catalog's root** rendered `FluentProvider` with no `AriaLiveAnnouncer`, so its message
  bars and announcements were silent; it has one.
- **Closing** it left the focus nowhere: it opens from SharePoint's command button in a place of
  its own; the command set keeps what had the focus and gives it back on dismiss.
- The close button had an `aria-label` («Lukk») and a tooltip label («Lukk katalogen»); the
  tooltip names it, and `CatalogCloseAria` is gone from the strings.

Tests first: the six tests in the new `TemplatePackageCatalog.test.tsx` and the new focus test
in `templatePackageCatalog.test.tsx` failed on the old code and pass; the details test failed on
jsdom's missing `Element.scrollTo` before the heading, so the test file stands one in.

The new test loaded the catalog's parts, largely untested, and PortfolioExtensions' coverage fell
under its floors (branches 69.9 %, functions 67.9 %). Twelve behaviour tests of those parts
followed: each kind of package's actions and confirmations, the badges, the empty states, the
toolbar's search, view, compatibility switch and clearing, and the installation's failed,
running and waiting states. Coverage is 53.09/81.00/77.02/53.09 in a full run of 122 tests, and
the floors are raised to 52/80/76/52.

### Slice 6, part 1 — The program administration (2026-10-19)

axe found nothing in the baseline. The list is the hub's `ListGrid` (slice 4), the commands the
library's `Toolbar`, whose buttons are restore targets now (slice 4, part 6), so the add dialog,
opened from state, gives the focus back to its button. What was left:

- **The search boxes** (the page's and the dialog's) had a placeholder and no name; they are named
  by what the placeholder says, unless the caller names them.
- **The project's logo** beside its title was an image named «Logo for prosjekt: …», so each
  project was read twice; it is hidden, as in the latest projects.
- **The add dialog's title** held an `h2` inside `DialogTitle`, which is an `h2` itself: a heading
  inside a heading. The title is the text.
- Noted: adding projects catches no error, so a failure shows nothing (a fault for everyone).
  Across the solutions, Fluent's `SearchBox` names its clear button «clear», in English, and keeps
  it out of the tab order (Escape clears): a sweep at close-out names it from the strings
  wherever a search box is.

Tests first: the new test in `ProjectList.test.tsx` and the first test of the new
`AddProjectDialog.test.tsx` failed on the old code and pass. The dialog's test loaded its hook,
untested, and the branch coverage fell under its floor (78.5 %); three behaviour tests of the
dialog followed (adding under the program's hub, cancel and Escape, a failed fetch and a hub with
no id, a hub not among the program's), and one of a search box named by its caller. Coverage is
47.32/79.37/70.58/47.32; the floors rise to 46/79/69/46.

### Slice 6, part 2 — The program aggregation and overview, and a regression CI found (2026-10-19)

**The program aggregation** renders the portfolio's `PortfolioAggregation` (slice 4, part 5); the
program mode changes its data, not its markup. Nothing of its own.

**The program overview** renders the portfolio overview. The baseline's 24 nameless commands
(`aria-command-name`) are not in CI's latest scan of it (run 39223161814): no violation.

**The regression.** The end-to-end run failed on three pushes in a row, on the status report's
snapshot flow, from the push that made every `Toolbar` button a restore target (part 6 of
slice 4). The copy-link dialog opens from state, from a plain button inside the snapshot dialog;
Tabster gave the focus to the latest restore target as it closed, now the toolbar's snapshot
button, behind the snapshot dialog held open in full screen, and the dialog's exit from full
screen could no longer be clicked. Before, there was no target, and the focus stayed. A dialog
opened from state inside a dialog or panel needs its own opener marked: the snapshot's
«Kopier lenke», and «Slett» in both column forms, whose confirmation sent the focus to the
column header behind the panel (the header a target since slice 4, part 3). Tests first: the
three new tests failed on the old code and pass.

**What the scan found.** The same run's scan of the portfolio overview reported
`aria-command-name` 42 times, serious: `StatusReportColumn` puts `PopoverTrigger` round a
`div` of status icons, which Fluent makes a button (and a restore target) with no name, and an
empty one for a project with no report. It is named by each section's status, «Statusrapport:
Kostnad: Grønn, Fremdrift: I rute», and a row with no report renders nothing. «Status rapportert»
in its popover was a literal. Tests first: both tests in the new `StatusReportColumn.test.tsx`
failed on the old code and pass. Noted: the icons show the status by colour alone in the cell,
the text only on hover or focus (1.4.1): a product decision. Also seen in the browser errors of
the list view extensions' tests (flaky, passing on retry): `Cannot read properties of null
(reading 'useContext')` from SharePoint's list view host; to be looked into.

### Slice 6, part 3 — The program timeline; the search boxes' clear button (2026-10-19)

**The program timeline** renders the library's `ProjectTimeline`, as the portfolio timeline
does, with what slice 1 and slice 4, part 6 gave it: no violation in CI's scan. Slice 6 is done
but for the hand rounds.

**The search boxes' clear button.** Fluent's `SearchBox` names its clear button (its `dismiss`
slot) «clear», in English, on a Norwegian page (3.1.2 for the part in another language, and a
name the user cannot match to what they hear elsewhere). `getSearchBoxDismissProps()`
(`shared-library/src/util`) names it from `Aria.SearchBoxClearLabel` («Tøm søket»), and every
search box takes it: the library's toolbar search, the project list's commands, the project setup's content and extension sections, the template package catalog and
the program administration's lists. It stays out of the tab order, as Fluent keeps it; Escape in
the box clears too. The hub list's header has no clear button at all (`contentAfter={null}`
removes the slot it sits in), so nothing there to name. Tests first: the toolbar's and the program
list's new tests failed on the old code and pass.

### Close-out, part 1 — CI's last findings, the floors and the release notes (2026-10-19)

The full test-channel run (39248212569) was green; its scans left one finding, also in the run
before: `scrollable-region-focusable` in the project information panel. The panel's body scrolls,
and with the actions hidden there is nothing in it to focus, so the keyboard could not scroll it.
`BasePanel` takes `isBodyFocusable`, which makes the body a stop for the keyboard and a region
named by the header, for a panel read rather than worked in; the project information panel sets
it, and a panel of fields does not (its fields are its stops). Tests first: the new tests in
`BasePanel.test.tsx` and `ProjectInformationPanel.test.tsx` failed on the old code and pass.

The coverage floors of shared-library, PortfolioWebParts, ProjectExtensions and ProjectWebParts
rise to the same run's figures, rounded down and one point under, no floor lower than before.
The release notes have a section on universal design, and their test counts are brought up to
date. Noted from the run: `pageerror: undefined` in most tests, also before this work, without a
message or a stack; and the date test checks 0 of 1 date-only fields, as on 2026-10-14, since the
e2e project's report has no value in it.

### Close-out, part 2 — the surfaces and the visual step in the browser, and what they found (2026-10-19)

Decided with the developer on 2026-10-19:

- **Hand rounds.** VoiceOver with Safari in every round, and NVDA with Edge as a sample on the
  timelines, the matrices, the hub's list and the phase selector. Contrast themes are checked
  through Chrome's `forced-colors` emulation, with Windows as a sample.
- **Blocking.** The 24 components clean in run 39248212569 go into `A11Y_BLOCKING` now, before
  their hand rounds.
- **The idea extensions** move to the issue's out of scope list.
- **Status column.** Its colour-only icons (1.4.1) are recorded as a deviation and get an issue
  of their own.
- **Timeline markers.** «I dag» is to get a label, and the time-lapse marker a shade that reaches
  3:1. Not done yet.
- **Trophy, idea phase bar and status icons.** The trophy's edge, the idea phase bar and the
  status icons' 40 px stay as they are.
- **What gets fixed in this pull request.** The disabled controls without a reason, the focus
  after a library switch, the dynamic list's column header menu, the project card's loading and
  error, the program's add error and the `useContext` flake.

**What the browser now checks.** The checks ask less of the hand rounds:

- `e2e/tests/smoke/a11y-surfaces.spec.ts` opens the panels, dialogs, menus and popovers no other
  spec opens. It scans each, closes it with Escape and expects the focus back on its opener.
- The snapshot, the status draft's panel, the program's add dialog and the hub timeline's details
  are scanned in the flows that open them.
- `a11y-visual.spec.ts` reports, and fails nothing. On the same pages as axe it measures:
  - what reaches past a web part at 320 px, with tables, grids and the timelines exempt;
  - what text spacing cuts off;
  - and it attaches pictures in forced colours.
- The pages are shared in `fixtures/pages.ts`, which adds the dynamic list. `DynList.aspx` is on
  the test hub, so the overview's "no page" was wrong.

**What it found**, each with tests that failed on the old code:

- **The focus back** went to the page's start after:
  - the view form opened from the toolbar's view menu, in the overview and the aggregation;
  - the four panels and dialogs of the project information's actions;
  - the news dialog.

  The toolbar's menu button, the actions and the news button are now restore targets.
- **The toolbar's menu button.** Its trigger's child was a box around the button, so
  `aria-haspopup` and `aria-expanded` sat on a `div`. The box is outside the trigger now.
- **«Nyttige lenker».** The menu opened on a spinner, with nothing in it to take the focus, so
  Escape and the arrow keys missed it. `usePromotedLinks` moves the focus to the first link once
  the links are loaded.
- **The template package catalog**, opened from SharePoint's «Mer» menu, had
  `aria-hidden="true"`.
  - Traced to SharePoint's own Tabster in `splistwebpack.js`, which hid it while its menu closed
    and never showed it again. Opened directly from the command bar, it is not hidden.
  - `whenHostMenuHasClosed()` (shared-library) waits until the focus has left the menu, and a
    moment more, before the catalog renders. The focus then goes back to «Mer», not to the gone
    menu item.
  - This is confirmed only by the browser test after deployment.
- **The status report heading.** In the project information it was a second `h2`; it is an `h3`
  now (`Header headingLevel`).

**What it settled:**

- `pageerror: undefined` is SharePoint's. Paused in the debugger, the rejection comes from its
  page assembly (`sp-pages-assembly`, a `setInterval` under `onBeforePageLoad`). On project pages
  its list bundle adds rejections of its own.
- The date test checked 0 of 1 because of its query, not the data. `FieldValuesAsText` expanded
  on list items holds only the fields the query also selects, with Created and Modified. With
  the fields selected it checks 1 of 1.
- «Hent dokumentmal» on the program's front page loads its strings and opens. The fault of
  2026-10-14 does not reproduce.
- The `useContext` flake is our footer on list pages: its hooks ran on the React copy of
  SharePoint's list view host (`listview-host-assembly`), while SPFx's `react-dom-18-bundle`
  rendered it. Not fixed yet.
