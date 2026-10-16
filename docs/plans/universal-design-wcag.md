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
