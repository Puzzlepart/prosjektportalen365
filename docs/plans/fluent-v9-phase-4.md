# Fluent UI v9, phase 4: coverage, the hub, and the hold-outs

Planned 2026-09-30 at the close of phase 3 (`docs/plans/fluent-v9-migration.md`). Runs on a new
branch off `main` once phase 3 has merged. The release that carries phases 3 and 4 is **1.15**; it
is not cut before this phase is done.

## Goal and non-goals

Goal: every web part root and interactive component has a test that meets Decision D, the browser
suite covers a program site, the navigation flows and two write flows, the v8 list hub in
PortfolioWebParts is on v9, and the three hold-outs (people picker, file type icons, `Autocomplete`)
are converted or re-decided — so that `@fluentui/react` leaves the repository, or stays only where
a decision in this document says so. Non-goals: Redux Toolkit 2 and xlsx 0.18 (separate migrations,
verdicts in the phase 3 plan), new features, and the lint allow-list beyond what a slice touches.

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

## Slices and order

| # | Slice | Scope | Exit |
|---|---|---|---|
| 0 | Branch and baselines | New branch off `main`; record the inventory above as the baseline, plus the six `.sppkg` sizes; confirm the channel version stamping from phase 3 works (a test-channel run whose bundles are new to the tenant) | Baselines in this document |
| 1 | Browser flows | A program site through `E2E_PROGRAM_URL` (its pages and the program administration list); the navigation flows (hub → project → back, the status page's section tabs, the project pages); two write flows that undo themselves — copy a document template into a test folder and delete the copy; create a status report draft and delete it — in a `tests/flows` folder | The flows run in the test-channel CI; the timeline and dialog smoke tests green |
| 2 | PortfolioWebParts tests | Render tests for the nine web part roots; behaviour tests for the hub (`List`: grouping, sorting, selection, column menu, sticky header presence) **before** it is converted, and for `PortfolioAggregation`, `IdeaModule`, `EditViewColumnsPanel`, `ProjectCard`, `LatestProjects`, `ResourceAllocation`; floors raised to the new totals | Every folder has a test; floors raised |
| 3 | ProjectWebParts tests | The ten roots; `ProjectInformation`, `ProjectPhases`, `DynamicList`, `DynamicMatrix`, `ProjectNews`, the matrices and the panel; the status page's remaining sections | Same |
| 4 | Extensions and program tests | ProjectExtensions' four extensions and `ProjectSetupDialog`, the dialogs; PortfolioExtensions' five extensions, `Footer`, the idea dialogs; ProgramWebParts' five roots | Same |
| 5 | shared-library tests | `CustomEditPanel` field elements, `FilterPanel`, `Toolbar`, `ProjectTimeline`, `Autocomplete`, `PeoplePicker`, the small components; adapter tests against structural stand-ins as `taxonomy/*.test.ts` does | Same; shared-library floor raised |
| 6 | The hub | `List` onto v9: `DataGridList` for rows, grouping rendered as group header rows with collapse state of our own, the sticky header in CSS, multiselect with shift-click ranges in place of marquee, the column context menu and the column form as they are (already v9); `IColumn` and `Selection` gone, `IListColumn` stays the data model; `PortfolioOverview` and `PortfolioAggregation` drop their v8 types; PortfolioWebParts drops `@fluentui/react` (Decision C) | Slice 2's hub tests green on v9; manual check of the overview and aggregation on the test tenant |
| 7 | The hold-outs | People picker on a v9 `TagPicker` with the Graph people search behind it, if the combobox family's harness loop is solved or worked around (Decision B's test in production stands); file type icons through `getFileTypeIconAsHTMLString` or the document icons of `@fluentui/react-icons` (Decision G re-decided on what looks right); `Autocomplete` on v9 `Combobox`; shared-library and ProjectExtensions drop `@fluentui/react` — or the decision that keeps it is written down | `grep -rl "from '@fluentui/react'"` is empty, or lists what a decision names |
| 8 | Close-out and release | Lint allow-list revisited (the house rules the slices touched), bundle sizes against slice 0, the definition of done, the release note for 1.15, `Install/` and the upgrade path checked on the test tenant | 1.15 cut |

Slices 2 to 5 are per solution and may run in a different order if a slice 1 finding says so.

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
this document; the lint allow-list is shorter than phase 3 left it; the release notes for 1.15
describe phases 3 and 4 as a technical change with no intended functional difference, listing the
visible differences made on purpose.
