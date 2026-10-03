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
- **P4-5. The hub drops marquee selection** (decided 2026-10-03 by the owner, before slice 6). Its
  one use is choosing the rows for "Eksporter til Excel" in both views; checkboxes, shift-click
  ranges and select-all cover that, and keeping v8's `MarqueeSelection` would keep
  `@fluentui/react` in PortfolioWebParts for one gesture.

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
before the error when no project came back. Both were fixed in slice 4.

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
  fetch the web part never settled (the test hung for 28 minutes). Latent in practice, since every
  hub call of that fetch has a fallback of its own and the fetch itself hardly ever fails. The list
  is memoized on the data.
- The dynamic list split a lookup value (`1;#Alfa`) on `;` before reading its name, so its filter
  offered `#Alfa` and `1`; lookup pairs are kept whole and named now.

Found and left: while the status page loads, its section tabs render the six placeholder sections
with an undefined value, which Fluent reports in the development console. Fixed in slice 4.

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

### Slice 4 — extensions and program tests (2026-10-02)

Twenty-eight test files added (24 in the three solutions of the slice, four in ProjectWebParts and
PortfolioWebParts for fixes), every extension, web part root and component folder of
PortfolioExtensions, ProjectExtensions and ProgramWebParts now under test. The slice began with the findings slices 2
and 3 had left for the owner.

- **PortfolioExtensions** (1 to 10 files, 1 to 100 tests): the footer with its site settings,
  configuration page, favourite projects, links (the administrator links for site admins only),
  installed version against the latest release, help and assistant; the five extensions as
  classes: the footer customizer's settings, its assistant access by group, by role and by both,
  and its loaders (installation log, links, GitHub releases, followed projects, help per level and
  page); the three idea commands (who sees them, the dialog's text and choices, the decision or
  recommendation written for each choice, the already-approved alert, an approved idea's fields
  copied into processing, the project data item and its edit form); the template package catalog
  command (template options list only, hub admins only, `showHidden` kept for the session, the
  drawer opened and dismissed); the two idea dialogs with their SPFx dialog classes; the idea
  configuration model.
- **ProjectExtensions** (9 to 20 files, 35 to 109 tests): the setup customizer from start to end,
  with every validation outcome (Teams channel, no group, not a member, not a site admin, another
  language than the hub, no hub, the hub itself, already set up and the two ways round that), the
  tasks in order with their progress and a failing one, the auto-configured and the locked
  template, the multilingual site, and a forced template's parent project with its old menu; the
  setup dialog with its template choice, cloud templates included, and its reducer; the base,
  error and progress dialogs; the risk action cell with its popover, new action panel, Planner
  preview and migration to Planner; the template selector command, the risk action field
  customizer, the upgrade customizer and the customizer's removal.
- **ProgramWebParts** (3 to 7 files, 13 to 30 tests): the five web parts as classes, the base one
  through each: the data adapter configured for the site, each component rendered with its
  props, the configuration errors, the aggregation's property updates (the pane refreshed while
  edited, the page saved while read) and the property panes.

**Found by the tests and fixed.**

- Left by slices 2 and 3: the status page reported any failure to fetch its reports as missing
  access; it says now that they could not be loaded, and keeps the access message for 401/403 and
  a hub out of reach. Its section tabs drew a tab for each placeholder section while the report
  loaded; those get none. The sub-site list's "Vis flere"/"Vis mindre" was hard-coded Norwegian;
  it is in the language files now. The project list's fetch had no error handling, so a failed
  fetch left the loading placeholders up for good, and the empty state came before the error;
  the error is shown now, before the empty state.
- The property panes of the portfolio aggregation, the idea module and the program aggregation
  read the default view from a configuration that is missing when the data source cannot be
  read, so the pane crashed exactly when it was needed to correct the data source.
- The footer's external help pages lost everything up to their last horizontal rule, since the
  pattern for the front matter was greedy; two images on one line broke the second image's link
  and turned the text between them into `%20`.
- "Opprett prosjektdata" crashed for an approved idea when the idea configuration had no
  `projectData` text (a configuration made before that text existed, or one an admin wrote); the
  model fills in empty texts, and the dialog takes a missing one.
- The help dialog rendered its content without a key.

Found and left: the template package catalog (its drawer, hooks and services, some 5 000
statements of PortfolioExtensions) has only its skeleton test; it is a feature with a plan of
its own (`template-catalog.md`) and the reason that solution's statement floor is low. Redux
Toolkit warns that the object notation of `createReducer` goes away in RTK 2 (the setup dialog's
reducer among others), for phase 5. The progress dialog's v8 `Icon` warns about icons that are
not registered under Jest (Decision G).

**Harness.** `pp365-jest-config` gained real, minimal SPFx base classes (`BaseApplicationCustomizer`,
`BaseListViewCommandSet`, `BaseFieldCustomizer`, `BaseClientSideWebPart`, `BaseDialog`). They are
ES5 constructor functions like SPFx's own, because the solutions compile to ES5 and an ES5
subclass cannot call a native class constructor. The stub also has SPFx's `Version`,
`Dialog.alert`/`prompt` and the property pane field factories, `LogLevel` has its real numbers,
and both stubs answer `asymmetricMatch` with `undefined`, since Jest took any stub value for a
matcher of its own. Into the testing guide and the skill went these facts: a `jest.mock` of one
stubbed package mocks all of them (wrap the stub in a `Proxy` instead), the combobox stand-in,
jsdom's navigation and the `DEBUG` constant. One correction: `npx heft test --test-path-pattern`,
which `AGENTS.md`, the guide and the skill gave for running one file, does nothing with Jest 30
(Heft's plugin passes the option under its Jest 29 name); `--test-path-ignore-patterns` with a
negative lookahead works.

**Floors.** Measured, then rounded down:

| Solution | Tests | Measured (stmts/branches/funcs/lines) | Floors, from |
|---|---|---|---|
| PortfolioExtensions | 100 | 39.9/78.9/70.7/39.9 | 37/75/67/37, from 0/2/2/0 |
| ProjectExtensions | 109 | 52.6/81.5/67.8/52.6 | 49/78/64/49, from 19/48/18/19 |
| ProgramWebParts | 30 | 41.4/75.5/63.0/41.4 | 38/72/60/38, from 29/32/7/29 |
| PortfolioWebParts | 87 | 58.0/61.0/43.2/58.0 | 55/58/42/55, from 48/56/42/48 |
| ProjectWebParts | 142 | 45.7/69.2/51.3/45.7 | unchanged, 42/66/48/42 |

ESLint and Prettier ran on every new and changed file and TypeScript on the five changed
solutions; Jest ran on all six solutions on the changed harness (the shared library's 213 tests
too). The full Heft builds are left to the push.

The push's CI run (37038630066) built all six solutions green with the new floors and upgraded the
test channel; the browser suite passed 28 of 29. The failure was a test of slice 1 that had never
tested anything: the status page's tab test clicked the last tab while the report was still
loading, which then was one of the placeholder tabs without a name, and an empty name matches any
heading. With the placeholders gone (above), it clicked a real tab, and a section's title is text,
not a heading. The test now looks for the section's title as text (the last on the page with that
name, since the summary repeats every title) and passes against the test tenant.

### Slice 5 — shared-library tests (2026-10-02)

Twenty-seven test files added (23 existed; 50 files, 367 tests, up from 213): every component and
data folder of the shared library is under test now, and every service but `DataSourceService`. The
adapters are tested against structural stand-ins for their PnPjs calls, as `taxonomy/*.test.ts`
does.

- **The edit panel** (`CustomEditPanel`, `useModel`, `useInitialTaxonomyValues`, `FieldContainer`):
  the fields that can be edited and not the hidden ones, save held back while a required field is
  empty, the save with its progress and a failed one, the rules of the URL, number and percentage
  fields, switches, choices, lookups (without what the configuration leaves out), terms and dates;
  what the model sends for each type (a link, people as SharePoint's ids, terms through the hidden
  text field, a lookup's id) and keeps when a person cannot be resolved; a stored term's labels in
  the page's language; the field container's label, hint, validation message and icon.
- **Filters and toolbar** (`FilterPanel`, `Filter/taxonomyHierarchy`, `Toolbar`): the empty state,
  the filters with more than one value under their groups, picking and folding, yes/no columns,
  term paths as a tree where a parent filters its branch; the toolbar's item builder, dividers,
  headers and widths, its buttons, a disabled item, the search box, an item's menu and the filter
  panel.
- **The timelines** (`ProjectTimeline`, `Timeline`): a group and a bar per project with its
  elements, the page's own project first, the filters (category, type, tag, project, project
  information, several values in one field), the errors; the timeline's groups and links, bars and
  milestones, time frame, grouping, and the details of each kind of element.
- **The small components**: `Autocomplete`, `PeoplePicker`, `OverflowTagMenu`, `ProjectLogo` (with
  its fallbacks to the template image and the initials), `UserMessage`, `WebPartTitle`,
  `PropertyPaneDescription`, `ConditionalWrapper`, `ColumnSearchPropertyField`, the confirmation
  dialog's hook and `BaseWebPartComponent`.
- **Data and services**: who may administer a project (`SPDataAdapterBase`: site admins, person
  fields and groups on the project and the hub) and its people search; the projects cache (memory
  and session, one fetch for callers asking at once, expiry, entries too large for the session);
  the aggregated search with its paging; the cloud template package (a real zip); the Excel export;
  the hub's settings and status reports (`PortalDataService`); the project's properties, phase,
  checklist and welcome page (`ProjectDataService`).

**Found by the tests and fixed.**

- The icon labels of `FieldContainer` (the forms of `Rediger prosjektinformasjon`, the status
  report's edit panel, the setup wizard, the column forms) were not tied to their field. Fluent
  hands a slot's render function the label's props, `id` and `for` among them, and the icon label
  dropped them, so the control had no accessible name. The rule is in `kodemonster.md` now
  ("Render-funksjoner for slots").
- The project admin check stopped at a role that names a field the project does not have, and at a
  project without the roles field, so one such role took away what the other roles gave.
- The portfolio and program timelines looked the page's own project up by its item's id instead of
  its group, and skipped group 0: the project was not put first when another one had the same
  title, or when it came first in the data.
- `ProjectDataService` turned a missing properties item into a TypeError instead of `null`.
  Changing the phase on a project without an item in `Prosjektegenskaper` failed and never reached
  the hub, though the method is written to fall back to it; saving the project information there
  showed "Cannot read properties of null". The context is `null` now, and the save says that the
  properties are missing, in the site's language.
- Latent: the autocomplete crashed on Enter with nothing highlighted and on a clear without an
  `onClear`, and the column search field on a dismissed suggestion list (both column forms render
  the plain input, their managed properties being commented out); the timeline's grouping menu
  memoized its label and check mark on the props alone (choosing a grouping re-renders the
  timeline from its parent today). `SPDataAdapterBase`'s lint findings (redundant case blocks,
  console calls) are cleared.

Found and left: `DataSourceService` has no test, and `PortalDataService` has tests for its settings
and status reports only. The phases and document types of `ProjectDataService` go through
`getTermStore`, which the runtime contract test covers. Its `getPropertiesLastUpdated` has no
caller and passes a field value object where the item id belongs. `UserMessage`'s `fixedCenter`
and `isCompact` do nothing.

**Harness.** No change to `pp365-jest-config`. Into the testing guide and the skill went: in an
open Fluent drawer `toBeVisible()` fails for everything, since the entry motion never ends under
jsdom (check the hiding attribute with `closest('[hidden]')`, and give role queries
`{ hidden: true }`); Fluent v8 components read the key from `keyCode`/`which`; and `new Image()`
never loads under jsdom (a `window.Image` stand-in, as in `ProjectLogo`'s test).

**Floors.** Measured on the 367 tests: 75 % statements, 81 % branches, 55 % functions,
75 % lines (the floors were 28/58/27/28, from the phase 3 close-out); the floors are 72/78/52/72.
ESLint and Prettier ran on every new and changed file and TypeScript on the shared library; Jest
ran on the whole shared library and, against the changed library, on all five consumers (468
tests, their coverage unchanged; the `ProjectDataService` fix came after that run, and no consumer
test calls the two methods whose behaviour it changes). The full Heft builds are left to the push.

The push's CI run (37107937758) built all five solutions green with the new floors and upgraded
the test channel (packages only); the browser suite passed 27 of 29. Neither failure was slice 5's
code:

- The status page's tab test clicked the last tab 0.2 s after the tabs appeared, while the sections
  were still fetching their data; each section that filled in pushed the last one down, out of
  view again. A user reads the page first: the test now waits until the section has stopped
  moving. It passes against the tenant, where the slower machine never hit the race.
- Three minutes after the upgrade, SharePoint still handed the project home the previous
  manifest of the template selector's command set (the page asked for
  `template-selector-command-set_82fa87a9…`, the new package holds `…_af316efc…`), and that bundle
  was gone. The rest of the page was already on the new version, and the version stamping does not
  help here: it stamps the solution, while the component keeps `1.14.0`. A setup step,
  `e2e/tests/deployment.setup.ts`, now waits up to ten minutes, before any test, until the hub and
  the project home load every bundle from the app catalog, and stops the run with the bundle's
  address if one is still missing after that.

The next run (37111173832) passed 29, the new setup step and the hub link test among them; the
tab test failed on both attempts, now with the sections settled. Its frames show why: the tabs
scroll smoothly, SharePoint collapses its header (76 px) when the page scrolls down past it and
expands it on the way up, and that change of layout stopped the scroll partway, between two
sections. On the developer's machine the header changes just after the scroll has ended (a
script recorded the scroll position every 50 ms), on the CI runner mid-scroll, so a user on a
fast machine meets it too. The tabs now scroll on to the section once the scrolling has ended
(`scrollend`, or after a second in a browser without it), and choosing another tab before that
cancels it (`SectionTabs/useScrollToSection.ts`, three tests). Its run (37114496550) built and
upgraded green and passed the browser suite, 30 of 30; slice 5 is closed.

### Slice 6 — the hub (2026-10-03)

The hub's `List` (PortfolioWebParts, under `Porteføljeoversikt`, `Aggregert oversikt` and the
program's views of both) is on Fluent UI v9, and PortfolioWebParts has dropped `@fluentui/react`
(Decision C; `rush update` refreshed the lockfile). Marquee selection is gone (P4-5).

**On `Table`, not `DataGridList`.** The slice table said `DataGridList`; reading Fluent's
`DataGrid` showed why not. It builds its rows from its items and keeps the selection itself, so a
group header row would have to be an item, select-all would select only the rows on the screen
(v8 selected the collapsed groups' items too), and there is no shift-click range to extend. The hub
renders on Fluent's `Table` primitives instead (`List/ListGrid`), with the same column sizing as
`DataGrid` (`useTableColumnSizing_unstable`, `fitColumnWidths` for the justified layout) and
`DataGrid`'s keyboard model (one tab stop, arrow keys across the grid through Tabster). The other
lists stay on `DataGridList`.

- **Rows and columns**: one row per item, cells through the hub's renderers as before, resizable
  columns, the compact height, the justified layout, the add column, the sort marked on its header
  (`aria-sort`), the header click and right click opening the column menu at the header, placeholder
  rows while loading (v8's shimmer), and the browser skipping the layout of rows out of view
  (`content-visibility`), since v9 has no virtualized table.
- **Groups**: a header row per group with its name and count, opening and closing on a click, and a
  button over the rows that closes or opens them all. The collapse state is the list's own, kept
  per group while the list is searched or filtered; the aggregation's two collapse actions are gone.
- **Selection**: a row's check or a click on the row toggles it (links and buttons in the row keep
  their own click), shift-click selects the rows between, as they stand on the screen, a group's
  check its items, the header's check every item, the collapsed groups' too. It is kept by item, so
  sorting and grouping keep it, and the items a search or filter leaves out leave it, so the Excel
  export never takes rows the user no longer sees. Both views get the selected items through
  `onSelectionChange`; v8's `Selection` and `IGroup` are gone from them.
- **Pinned header**: v8's `ScrollablePane` and `Sticky` are replaced by CSS. The list still fills
  SharePoint's main content area and scrolls there; the title scrolls away (as v8's stuck header
  hid it), the command bar sticks to the top, and the column headers stick under it
  (`--pp-list-sticky-top`, the bar's measured height).

**Found and fixed.** The aggregated overview made its groups in the reducer from all its items, but
the list showed the items left after search and filters: as soon as either left items out, rows
appeared under the wrong group headers. The groups are made from the items shown now
(`PortfolioAggregation/createGroups.ts`, four tests).

**Tests.** `List.test.tsx` went from 9 to 19 tests: the groups opening and closing one by one and
all at once, the selection by check, by row click, by shift-click (a collapsed group's rows left out
of a range), by group and by select-all, the selection pruned when items leave, the placeholder rows
and the sort marker. Two tests changed with the API: the overview reducer's selection action takes
the selected items, and the overview's groups no longer carry v8's extra fields. The lint debt in
the two touched files with warnings is paid.

**Floors.** PortfolioWebParts measured 59.6/64.2/45.9/59.6 on 101 tests (from 87); the floors are
56/61/42/56 (from 55/58/42/55). TypeScript ran on PortfolioWebParts and, against its regenerated
declarations, on ProgramWebParts, which renders both views; ESLint and Prettier on every changed
file; Jest on all of PortfolioWebParts (101) and ProgramWebParts (30, coverage unchanged). The full
Heft builds are left to the push.

Left to check on the tenant: the pinned header in both views on a long list, the column resize and
the justified layout, and the time a large aggregation (a thousand rows or more) takes to render
without virtualization.

## Rules for the executing agent

The manual check of the tenant found the label fix working for the fields with Fluent v9
controls (text, number, choice, yes/no, note): the label carries `for` and `id`, and clicking it
puts the cursor in the field. The date picker takes an id of its own, so its label's `for` points
at nothing, though `Input` then names it through `aria-labelledby`; the people picker and the term
picker are v8 controls that know nothing of Fluent's `Field`, and stay without a name. The icon
sits beside the label, not in it, so clicking the icon does nothing. Left for the owner to decide.

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
  overview's users, or the hub keeps a v8 selection layer. Decided: dropped (P4-5).
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
