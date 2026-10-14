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
