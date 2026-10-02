# Fluent UI v9, phase 4: coverage, the hub, and the hold-outs

Planned 2026-09-30 at the close of phase 3 (`docs/plans/fluent-v9-migration.md`); updated
2026-10-01 after the merge. Runs on a new branch off `releases/1.15`, the integration line for
1.15 (phase 3 merged there as #1777; `main` still ends at 1.14). **1.15 is not cut before this
phase and phase 5, the dependency upgrades (`docs/plans/dependency-upgrades-phase-5.md`), are
done, and the user says when 1.15 is done.**

## Goal and non-goals

Goal: every web part root and interactive component has a test that meets Decision D, the browser
suite covers a program site, the navigation flows and two write flows, the v8 list hub in
PortfolioWebParts is on v9, and the three hold-outs (people picker, file type icons, `Autocomplete`)
are converted or re-decided — so that `@fluentui/react` leaves the repository, or stays only where
a decision in this document says so. Non-goals: new features, the lint allow-list beyond what a slice touches, and browser tests for
users with other permission levels (P4-4; a slice of their own later). Redux Toolkit 2,
xlsx 0.18 and React 18 are phase 5, which follows this phase on the way to 1.15.

## Inventory (2026-09-30)

**Tests.** Test files against what there is to test (component folders under `src/components`,
web part roots under `src/webparts`, extensions under `src/extensions`):

| Solution | Test files | Component folders | Web part roots | Extensions | Floors (stmts/branches/funcs/lines) |
|---|---|---|---|---|---|
| shared-library | 20 | 21 | – | – | 28/59/27/28 |
| PortfolioWebParts | 3 | 11 | 9 | – | 12/16/12/12 |
| ProjectWebParts | 6 | 11 | 10 | – | 12/19/7/12 |
| ProjectExtensions | 6 | 6 | – | 4 | 19/48/18/19 |
| ProgramWebParts | 2 | 1 | 5 | – | 29/32/7/29 |
| PortfolioExtensions | 1 | 4 | – | 5 | 0/2/2/0 |

No web part root or extension has a test. Component folders with none, by size (`.tsx` files):
PortfolioWebParts `List` 13, `PortfolioAggregation` 9, `IdeaModule` 7, `EditViewColumnsPanel` 3,
`ProjectCard` 2, `LatestProjects`, `ResourceAllocation`; ProjectWebParts `ProjectInformation` 21,
`ProjectPhases` 17, `DynamicList` 11, `DynamicMatrix` 7, `ProjectNews` 5, `ProjectInformationPanel`,
`OpportunityMatrix`, `RiskMatrix`; ProjectExtensions `ProjectSetupDialog` 6 (two of its sections tested at the close-out), `@BaseDialog`,
`ErrorDialog`, `ProgressDialog`; PortfolioExtensions `Footer` 17, `IdeaApprovalDialog`, `IdeaDialog`;
shared-library `CustomEditPanel` 23 (one test), `FilterPanel` 7, `ProjectTimeline` 7, `Toolbar` 6,
`Autocomplete`, `FieldContainer`, `PeoplePicker`, `UserMessage` and the small ones. Folders with a
test already: `ProjectStatus` 5, `DocumentTemplateDialog` 3, `PortfolioOverview` 2, `DataGridList` 2,
`ProjectTimeline` (ProjectWebParts) 1, `ProjectList` 1, `ProgramAdministration` 2, `RiskAction` 1,
`TemplatePackageCatalog` 1, `ItemColumn` 5.

**Browser suite.** Six files, 18 tests: sign-in, the hub's pages, a project's pages, a program
site (skips without `E2E_PROGRAM_URL`), the timeline list's fit and the document template dialog's
fit and folder unchoose. Two opt-in files under `tests/local/` load a solution's local bundle onto
the tenant page (`E2E_LOCAL_BUNDLE=1`, see `e2e/README.md`); the timeline one works, the dialog one
does not yet (the debug loader does not render the deployed command set's command).

**v8, where it still is.** PortfolioWebParts, 15 files: the hub (`List/List.tsx`, `types.ts`,
`useList.ts`, `useAddColumn.ts`, `ListHeader/*` ×3, `ItemColumn/useOnRenderItemColumn.tsx`) and the
two web parts that drive it through v8 types (`PortfolioOverview/context.ts`, `reducer/actions.ts`,
`hooks/useFilteredData.ts`, `hooks/usePortfolioOverview.ts`; `PortfolioAggregation/types.ts`,
`reducer/actions.ts`, `usePortfolioAggregation.ts`). shared-library, 6 files: `Autocomplete` ×3,
`ItemColumn/FileNameColumn`, `PeoplePicker`, `icons/index.tsx`. ProjectExtensions, 6 files: the
file type icon render sites (Decision G). `@fluentui/react` is a dependency of those three solutions.

## Decisions

Carried over from phase 3 unless re-decided here: **A** (the hub converts last, now: after the
coverage pass), **B** (people picker: one shared wrapper, v8 inside until v9 has a picker that
works), **D** (tests before conversion; full component coverage), **E** (lint debt paid in the files
a slice touches), **G** (file type icons stay v8 until a v9 route exists).

- **P4-1. Order: browser flows first, then tests per solution by risk, then the hub, then the
  hold-outs** (decided 2026-09-30). The flows catch what unit tests cannot — a stale bundle, a
  broken deployment, a page that no longer loads — and the hub conversion lands only on a
  PortfolioWebParts that has tests around it.
- **P4-2. One plan, one branch** (decided 2026-09-30). The coverage pass and the hub conversion are
  slices of this phase, not phases of their own; each slice is still its own commit series with a
  green rebuild and a green test-channel run.
- **P4-3. Write flows must clean up after themselves**, on the test tenant only, with a dedicated
  test user: nothing a flow creates survives the run, and a flow that fails half-way leaves an
  item that the next run recognises and removes.
- **P4-4. One account for the suite, the tenant admin, for now** (decided 2026-10-01; replaces the
  dedicated test user of P4-3). Every test signs in as the admin, so nothing a test asserts may
  depend on being less than admin. Tests for users with other permission levels (member, visitor,
  the project roles) come later, as a slice of their own with their own accounts.

## Slices and order

| # | Slice | Scope | Exit |
|---|---|---|---|
| 0 | Branch and baselines | New branch off `releases/1.15`; record the inventory above as the baseline, plus the six `.sppkg` sizes; confirm the channel version stamping from phase 3 works (a test-channel run whose bundles are new to the tenant) | Baselines in this document |
| 1 | Browser flows | A program site through `E2E_PROGRAM_URL` (its pages and the program administration list); the navigation flows (hub → project → back, the status page's section tabs, the project pages); two write flows that undo themselves — copy a document template into a test folder and delete the copy; create a status report draft and delete it — in a `tests/flows` folder | The flows run in the test-channel CI; the timeline and dialog smoke tests green |
| 2 | PortfolioWebParts tests | Render tests for the nine web part roots; behaviour tests for the hub (`List`: grouping, sorting, selection, column menu, sticky header presence) **before** it is converted, and for `PortfolioAggregation`, `IdeaModule`, `EditViewColumnsPanel`, `ProjectCard`, `LatestProjects`, `ResourceAllocation`; floors raised to the new totals | Every folder has a test; floors raised |
| 3 | ProjectWebParts tests | The ten roots; `ProjectInformation`, `ProjectPhases`, `DynamicList`, `DynamicMatrix`, `ProjectNews`, the matrices and the panel; the status page's remaining sections | Same |
| 4 | Extensions and program tests | ProjectExtensions' four extensions and `ProjectSetupDialog`, the dialogs; PortfolioExtensions' five extensions, `Footer`, the idea dialogs; ProgramWebParts' five roots | Same |
| 5 | shared-library tests | `CustomEditPanel` field elements, `FilterPanel`, `Toolbar`, `ProjectTimeline`, `Autocomplete`, `PeoplePicker`, the small components; adapter tests against structural stand-ins as `taxonomy/*.test.ts` does | Same; shared-library floor raised |
| 6 | The hub | `List` onto v9: `DataGridList` for rows, grouping rendered as group header rows with collapse state of our own, the sticky header in CSS, multiselect with shift-click ranges in place of marquee, the column context menu and the column form as they are (already v9); `IColumn` and `Selection` gone, `IListColumn` stays the data model; `PortfolioOverview` and `PortfolioAggregation` drop their v8 types; PortfolioWebParts drops `@fluentui/react` (Decision C) | Slice 2's hub tests green on v9; manual check of the overview and aggregation on the test tenant |
| 7 | The hold-outs | People picker on a v9 `TagPicker` with the Graph people search behind it, if the combobox family's harness loop is solved or worked around (Decision B's test in production stands); file type icons through `getFileTypeIconAsHTMLString` or the document icons of `@fluentui/react-icons` (Decision G re-decided on what looks right); `Autocomplete` on v9 `Combobox`; shared-library and ProjectExtensions drop `@fluentui/react` — or the decision that keeps it is written down | `grep -rl "from '@fluentui/react'"` is empty, or lists what a decision names |
| 8 | Close-out | Lint allow-list revisited (the house rules the slices touched), bundle sizes against slice 0, the definition of done, the release note's technical section brought up to date, `Install/` and the upgrade path checked on the test tenant | Phase 5 starts |

Slices 2 to 5 are per solution and may run in a different order if a slice 1 finding says so.

## Slice log

### Slice 0 — branch and baselines (2026-10-01)

Branch `feat/fluent-v9-phase-4` off `releases/1.15` at `1592f8c2`. Baselines, measured from the
last full `rush rebuild` on that commit and the tree:

| Solution | Tests | Test files | Floors (stmts/branches/funcs/lines) | v8 files |
|---|---|---|---|---|
| shared-library | 208 | 21 | 28/58/27/28 | 6 |
| PortfolioWebParts | 14 | 3 | 12/16/12/12 | 15 |
| ProjectWebParts | 21 | 6 | 12/19/7/12 | 0 |
| ProjectExtensions | 29 | 9 | 19/48/18/19 | 6 |
| ProgramWebParts | 13 | 3 | 29/32/7/29 | 0 |
| PortfolioExtensions | 1 | 1 | 0/2/2/0 | 0 |
| **All** | **286** | **43** | | **27** |

(The setup dialog's three hook tests, 6 cases, landed after that build: 292 at the tip.) Lint
warnings: 246, all house rules. Browser suite: 23 tests in 8 files (smoke and flows; the four
local-bundle specs are opt-in). Production packages from the same build, main channel:
PortfolioWebParts 9.87 MB, ProjectWebParts 7.03 MB, ProgramWebParts 4.62 MB, shared-library
1.98 MB, PortfolioExtensions 1.42 MB, ProjectExtensions 1.12 MB (16.0 MB in all); slice 8 compares.

**Stamping, confirmed indirectly.** The tenant app catalog is closed to the test user (403), and
the release script silenced `modifySolutionFiles.js`, so no log named the version. The evidence is
behavioural: the three deployments since the stamping each served the fix the browser suite then
saw (the column's place, the program selection, the setup dialog's order), where the deployment
before it had served a stale bundle for days. `Build-Release.ps1` now prints each package's
stamped version after the channel ids are applied, so the next run's log says it outright.

**Slice 1, adjusted.** Two write flows already run in CI from the phase 3 close-out (the overview
column, the program's child project), so slice 1 is the navigation flows plus the two write flows
the plan named — a status report draft created and deleted, a document template copied and the
copy deleted — which exercise the status commands and the template dialog end to end.

### Slice 1 — browser flows (2026-10-01)

Three new files under `e2e/tests/flows/`, with the REST writes they need in `fixtures/rest.ts`:

- **`navigation.spec.ts`**, read only: from the hub's overview into a project through its title
  link and back; the status page's section tabs, which scroll to their section and stay pinned
  (the test project has a published report, since the sections only show for one); every link in the project's quick launch opened in turn — pages and list views alike, since
  most of a project's navigation is list views, not site pages — with a web part or a list shown
  and no error boundary; and the project home's link back to the hub.
- **`document-template-copy.spec.ts`**, a write flow: a template is copied into the project's
  library through "Hent dokumentmal", renamed on the way to an `E2E-kopi-` name, confirmed through
  REST and deleted again; leftovers go first. Two traps on the way: a folder's name in the
  template list is a v8 `Link` without an href, which is a button, so a file row is one without a
  button; and the rename applies 400 ms after the last keystroke, once the library has said the
  name is free, so the copy must wait for it or it copies under the template's own name.
- **`status-report.spec.ts`**, a write flow: "Opprett" opens the edit panel with the draft's
  properties, saving the panel creates the report, "Slett" removes it; the hub's status list is
  cleaned of the test user's drafts for the project before and after. **Skipped on both test
  projects at first:** the save stays disabled on a project with no earlier report to copy values
  from (required fields), and on the project with reports the test user was not a project admin,
  so "Opprett" was not offered. Resolved the same day by decision: the suite signs in as the
  tenant admin for now, and the one test project (`E2E_PROJECT_URL`) is one with published
  reports; see the paragraph below.

**A crash the flows found.** The console guard failed the status flow on the project with reports:
`Could not load footer-application-customizer in require: Cannot read properties of undefined
(reading 'themePrimary')`. The shared theme helper read `window.__themeState__.theme` at module
load, and an application customizer can load before SharePoint has published the theme, which took
the footer's whole bundle down on that site. The read now falls back to SharePoint's default
primary colour, with a test that loads the module with no theme state, an empty one and a themed
one. The fallback only applies when the theme is not there yet, so a themed site keeps its colour
wherever the components load after the page.

**After the first CI run of the slice (run 36849685631, green).** Three tests passed on their
retry, all on the connection to SharePoint in the same six minutes: the program site's SitePages
listing never answered twice (one and four minutes), and the project home navigation ended in
`net::ERR_TIMED_OUT`. The test runner gives `page.request` no timeout of its own, so a stalled
request ran until the test timed out. The shared fixture now bounds the listing to 30 s, sends a
request or navigation that failed at the network level once more, and keeps one SitePages listing
per site per worker instead of one per test. A local run of the whole suite the same day had the
same stall on the column flow's first REST call, so every REST call of the fixtures and specs now
goes through `restGet`/`restPost` in `fixtures/rest.ts`: bounded, reads and the digest sent again
after a network failure, writes sent once (a stalled delete may still have been applied). Two tests were skipped: the status flow, on a
project where the draft could not be saved (see below), and the hub's "project status aggregation" smoke,
which looked for a page the hub template never provisions; it now opens the delivery overview (or
the uncertainty overview or the experience log) and expects the aggregation web part past its
loading state. The views diagnostic in the column flow asked for `GtIsDefaultView`, which is
`GtPortfolioIsDefaultView`, so its attachment was a 400; fixed.

**One account, one project (decided 2026-10-01).** The suite signs in as the tenant admin for now;
tests for users with other permission levels come later, as their own slice. With that, the
separate status project (`E2E_STATUS_PROJECT_URL`, never set in the repository) is gone: there is
one test project, `E2E_PROJECT_URL`, pointed at the Frisbee project the same day, which has
published reports, so the status flow and the status page's tab test run there. An unpublished
report from 2025 (item 28 in the hub's status list) kept "Opprett" disabled on that project until
it was published; the flow's skip message now names any draft that blocks it, and says that the
permission is missing when there is none. The project switch also skipped the dialog smoke's
"unchoose" test, since the Frisbee library has no subfolder: the test now adds a folder of its own
(`E2E-mappe`) to a library without one, and removes it again.

### Slice 2 — PortfolioWebParts tests (2026-10-01)

Fourteen test files added (three existed; 17 files, 81 tests, up from 14), one per component
folder: the solution's nine real folders all have a test now (the inventory's eleven counted two empty, untracked directories on the
developer's disk, `PortfolioInsights` and `ProjectProvision`, which are not in the repository).

- **The hub list, before its conversion** (`List/List.test.tsx`, `useAddColumn.test.ts`,
  `ColumnContextMenu/renderMenuItem.test.tsx`): the header with title, search box and toolbar in
  the same block as the column headers (the block that stays pinned); one row per item, the title
  as a link to the project or as text with the no-data explanation; a cell rendered through its
  own renderer, its display field, its fallback or its configuration, and through the registry
  (the hub column); hidden columns and the add column, which is there unless disabled — the
  overview relies on that; the header click and right click that open the column menu; groups
  with their names and a collapsed group's hidden rows; selection through the v8 `Selection`,
  reported on change. The column menu's item kinds and the click that runs an item and closes
  the menu.
- **The overview's rules** (`PortfolioOverview/hooks/useFilteredData.test.ts`,
  `reducer/reducer.test.ts`, `ColumnContextMenu/ColumnContextMenu.test.tsx`): search on every
  column, the active filters, grouping with "not set" and the Yes/No grouping of boolean columns,
  the sort within groups (the direction applies to the group value too); the reducer's sorting per
  data type and by a custom order, the sorted column's marks, group-by toggling, filters, the
  selection, the fetched data, the error named after the view, a saved column's place at the end
  of the view order, deleted and chosen columns; the column menu's choices, who may use them and
  what each dispatches, read from the hook. One fact pinned on the way: in this web part
  `isSortedDescending: true` is the "A til Å" choice, that is ascending.
- **Render tests for the root components** the web parts mount (`LatestProjects`,
  `ProjectCard`, `ProjectList`, `ResourceAllocation`, `IdeaModule`, `PortfolioOverview`,
  `PortfolioAggregation`) with the data fetch replaced, plus `EditViewColumnsPanel`'s choosing,
  moving, saving and reverting.

**Harness.** The PnP stub now returns the real pure helpers of `@pnp/core` (`stringIsNullOrEmpty`
and friends, an in-memory `PnPClientStorage`), so a branch such as "render the display field when
there is one" behaves as in the browser. Three facts about Fluent under jsdom went into the testing
guide and the skill: v8 `DetailsList` needs `onShouldVirtualize` to render rows; a v9 menu item must
be clicked with a plain click event (user-event's pointer sequence never settles and stalls the
worker for minutes), a nested v9 menu cannot be opened at all, and every open menu costs tens of
seconds to tear down, so a file renders a menu once and reads the choices from the hook.

**Found by the tests and fixed.** The group-by item of both column menus was a checkable item with
no name and value, so the menu kept its checked state under an undefined key and never showed the
check mark; it has them now. The column menu's divider and submenu, and the shared toolbar's items,
rendered without keys (a warning on every render). Found and left: `ProjectList`'s data fetch has no
error handling, so its error state is unreachable from a failed fetch; the empty state is shown
before the error when no project came back. Both are noted for the owner, not changed.

**Floors.** Measured on the 81 tests: 50 % statements, 59 % branches, 45 % functions, 50 % lines
(from 12/16/12/12); the floors are 48/56/42/48. ESLint, TypeScript and Jest were run on the changed
files separately; the full Heft build of the solution and the shared library's rebuild (its toolbar
now keys its items) are left to the push, since the machine's endpoint protection made every build
take an hour that day. The push's CI run (36974502735) built all five solutions green, with
every solution's Jest passing on the changed PnP stub; its end-to-end job failed on four network
errors inside a two-minute window from the runner to SharePoint (25 passed, 3 flaky, 1 failed), the
environment again. Two of them exposed a gap in the fixture's retry: Playwright words a bounded
request's timeout as "Timeout 30000ms exceeded", and Chromium's error page shows as a navigation
"interrupted by another navigation to chrome-error://", and the retry recognised neither. It does
now, and pauses three seconds before the second attempt. The slowness of that day's local builds is
the machine's endpoint protection, measured on 2026-10-02 (a compile with 9 s of CPU takes 29 s, a
first load of Fluent's modules 26 s against 1 s the second time); an exclusion was requested from IT.

### Slice 3 — ProjectWebParts tests (2026-10-02)

Twenty-seven test files added (six existed; 33 files, 139 tests, up from 21), covering every
component folder in the repository (`ArchiveDialog` is, like the two in slice 2, an empty untracked
directory on the developer's disk). The two base web parts are SPFx classes with nothing to render
in Jest; the end-to-end smoke covers them.

- **The status page** (`ProjectStatus.test.tsx`, `reducer.test.ts`, `Commands/useToolbarItems`,
  `Sections/useSections`, `Sections/scopeTokens`, `StatusElement`, `parseSubProjects`): the page
  with a published report and with a draft, the report commands each user may run, the history,
  the snapshot and source links, the report series selector and its options (including a series
  whose key is no longer configured), which sections show for a report and a series, the status
  element with its truncated comment and icon-only variant, and every reducer rule.
- **Project information** (`ProjectInformation`, `ProjectProperties`, `Actions`,
  `ProjectStatusReport/useProjectStatusReport`, `ProjectInformationPanel`): properties rendered by
  type, the actions by permission and project kind, parent and child projects with the fold, the
  latest report per series, and the panel's two ways of opening.
- **The phase selector** (`ProjectPhases`, `ChangePhaseDialog`, its reducer): the visible phases and
  the end phase near the end, the popover with checklist status and the change action by
  permission, the dialog's walk through the open checkpoints with the comment rule, the mandatory
  checklist, the summary and the confirmation.
- **The rest**: the dynamic list (rows, single-item view, empty and error states, filters, search,
  field visibility), the matrix grid and both uncertainty matrices with the after-action switch,
  the news web part and its file-name rules, the timeline with its groups and item transformation.

**Found by the tests and fixed.**

- The shared `Fluent` wrapper (`shared-library/src/components/Fluent`) memoized its whole tree with
  no dependencies, since v1.9.0 (February 2024), so whatever the first render chose stuck. On the
  status page that is the branch picked before the data arrives: a failed fetch set the error, and
  the page kept showing its toolbar and never the message. The project information web part renders
  through the same wrapper. It renders its children on every render now, with a test.
- The child projects list of the project information web part built a new empty list on every
  render when the data had none, and its effect re-ran on every render with it: after a failed
  fetch the web part never settled (the test hung for 28 minutes). The list is memoized on the data.
- The dynamic list split a lookup value (`1;#Alfa`) on `;` before reading its name, so its filter
  offered `#Alfa` and `1`; lookup pairs are kept whole and named now.

Found and left: while the status page loads, its section tabs render the six placeholder sections
with an undefined value, which Fluent reports in the development console.

**Harness.** Two more facts in the testing guide and the skill: role queries cost seconds each in a
large Fluent tree (text and title queries instead there), and a component doing async work after
its test ended takes the Jest worker down ("the `document` global ... is not defined anymore"), so
the phase selector's tests unmount and let that work finish in `afterEach`. Opening a phase's
popover blocked for 13 s on the loaded machine, and the first push's CI build (37001404506) failed
on it: the three tests that open one ran past a 60 s timeout each (136 of 139 passed). Fluent
positions an open popover against its trigger, and that is what costs under jsdom. The phase
selector's test now stands in for `Popover`, `PopoverTrigger` and `PopoverSurface` with a plain
popover that keeps Fluent's contract (the trigger toggles through `onOpenChange`, the surface shows
while open), and the three tests run in the default time.

**Floors.** Measured on the 139 tests: 45 % statements, 69 % branches, 51 % functions, 45 % lines
(from 12/19/7/12); the floors are 42/66/48/42. ESLint and Prettier ran on every new and changed
file, TypeScript on both solutions, and Jest on the whole of ProjectWebParts and the shared library;
the full Heft builds are left to the push.

## Rules for the executing agent

- Read `AGENTS.md`, the `pp365-toolchain` and `pp365-testing` skills, this plan and the phase 3
  plan's slice logs before the first edit; the traps are recorded there (the harness loop of the
  combobox family, the load-sensitive dialog test, Tabster's `aria-hidden`, the stale bundles, the
  `.scss` v8 imports, Fluent's selection cell offset and per-column padding).
- Never run git; the developer commits from your messages. End every batch with a semantic commit
  message. Never bypass Rush.
- Tests first (Decision D); `jest.mock` above the imports; no `@pnp/*` in tests; assert on what the
  component renders, not on Fluent internals or Tabster's focus state.
- A fix on the tenant is verified with the local bundle before it is deployed where a `tests/local`
  variant exists (`e2e/README.md`); never start a dev server on a solution a build is running on.
- After each slice: `rush rebuild` green, push, wait for the test-channel run including the
  browser suite, then manual check of the affected surfaces on the test tenant.

## Risks

- Marquee selection has no v9 equivalent; shift-click ranges and select-all must be enough for the
  overview's users, or the hub keeps a v8 selection layer. Decide with the users of the aggregation
  views before slice 6.
- The write flows touch a real tenant; a failed clean-up leaves test data. Mitigation: a fixed prefix
  on everything a flow creates and a clean-up step that runs first.
- The combobox family loops the Jest worker on React 17; the people picker's tests may have to stay
  at the wrapper's edge as in phase 3.
- Budget: prefer few, focused agents per slice; the coverage slices are the largest and can pause
  between solutions.

## Definition of done

Every web part root, extension and interactive component has a test file meeting the Decision D
targets, and the floors in each solution's `jest.config.json` sit at the new totals; the browser
suite runs a program site, the navigation flows and two write flows in CI; the hub is on v9 and
PortfolioWebParts has no `@fluentui/react`; the hold-outs are converted or named by a decision in
this document; the lint allow-list is shorter than phase 3 left it; the release note's technical
section describes phases 3 and 4 as a technical change with no intended functional difference,
listing the visible differences made on purpose. The release itself is phase 5's.
