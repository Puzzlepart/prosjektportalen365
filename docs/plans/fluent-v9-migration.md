# Plan: Fluent UI v8 to v9 completion and dependency hygiene (Phase 3)

Written 2026-09-22 on `feat/fluent-v9-migration`, after Phases 0 to 2 (SPFx 1.23/Heft, PnPjs 4, testing regime) were merged to `releases/1.15`. Execution is intended for an agent working slice by slice; the rules below are the decisions, the slices are the work.

## Goal and non-goals

Goal: every component renders with Fluent UI v9 (`@fluentui/react-components`) so that `@fluentui/react` (v8), `@uifabric/*`, `fabric.min.css` and the two webpack aliases that exist only for them can go, and the ~414 lint warnings the build tolerates are gone.

Non-goals: React 18 and SPFx 1.24 (Phase 4), the shared library as a runtime component (Phase 5), any functional change. As in Phase 2, a visible difference from 1.15 that was not asked for is a bug.

## Inventory (2026-09-22)

Files importing v8 (`@fluentui/react` or `@fluentui/react/lib/*`):

| Solution | Files |
|---|---|
| ProjectWebParts | 59 |
| PortfolioWebParts | 56 |
| shared-library | 52 |
| ProjectExtensions | 33 |
| PortfolioExtensions | 12 |
| ProgramWebParts | 2 |
| Total | 214 |

What they import, grouped by the v9 answer:

| v8 usage | Files | v9 answer | Difficulty |
|---|---|---|---|
| `format` (51 from the barrel, 18 from `lib/Utilities`, 3 from `@uifabric/utilities`) | ~72 | A `format` helper in `pp365-shared-library/util` (identical `{0}` semantics). Pure find and replace. | Trivial |
| `getId` (`@uifabric/utilities`, `lib/Utilities`), `useId` (`@fluentui/react-hooks`) | 9 | `useId` from `@fluentui/react-components` | Trivial |
| `Icon`, `IIconProps` | 11 | `getFluentIcon` / `getFluentIconWithFallback` from the shared library (already the convention) | Easy |
| `MessageBar`, `MessageBarType` | 15 | v9 `MessageBar` (`intent`), already partly in use | Easy |
| `Shimmer`, `ShimmerElementType` | 8 | `Skeleton` (the shared `LoadingSkeleton` exists) | Easy |
| `TextField`, `Toggle`, `Slider`, `Checkbox`, `Dropdown`, `DefaultButton`, `Link`, `Label` | 23 | `Input`, `Switch`, `Slider`, `Checkbox`, `Dropdown`/`Combobox`, `Button`, `Link`, `Label` (`Field` for labels and validation) | Easy |
| `Panel`, `PanelType`, `IPanelProps` | 18 | `OverlayDrawer` (size maps from `PanelType`), wrapped in `IdPrefixProvider` + `FluentProvider` per the repo convention | Medium |
| `ContextualMenu`, `IContextualMenuItem`, `Callout`, `Target` | 10 | `Menu` / `Popover`; `IContextualMenuItem` arrays become `MenuItem` children, positioning via `positioning` | Medium |
| `Dialog`, `Breadcrumb`, `ProgressIndicator`, `Sticky` | 6 | v9 `Dialog`, `Breadcrumb`, `ProgressBar`; `Sticky` has no v9 equivalent and is only used with `DetailsList` (see Decision A) | Medium |
| `NormalPeoplePicker`, `IPersonaProps` | 7 | No v9 people picker. Decision B. | Hard |
| `DetailsList`, `ShimmeredDetailsList`, `IColumn`, `Selection`, `IGroup`, `IDetailsHeaderProps` | 44 | No v9 equivalent with grouping, sticky headers and column resizing together. Decision A. | Hard |

Related hygiene: `pzl-spfx-components` (1 file in ProjectWebParts; the only reason for the `office-ui-fabric-react` alias in `spfx-customize-webpack.js`), `@fluentui/react/dist/css/fabric.min.css` (5 web parts; only `ms-Grid` mixins in `SummarySection.module.scss` still depend on Fabric core), `@uifabric/file-type-icons` (1 file; `@fluentui/react-file-type-icons` is already a dependency), `pzl-react-reusable-components` (2 files in PortfolioWebParts, both only for `useConfirmationDialog`; declared but never imported in ProgramWebParts — see the slice 0 log for what it drags in), four packages with React 15/16-era peers (`react-autocomplete`, `react-image-fade-in`, `react-scroll`, `react-calendar-timeline` via `create-react-context`), Redux Toolkit 1.9 (2.x available), `xlsx` 0.16 (0.18.5 is the last npm release), `react-markdown` 8 (10 is ESM-only; fine under webpack, stubbed under Jest).

Versions: `@fluentui/react-components` ~9.72.10 → 9.74.8, `@fluentui/react-icons` ~2.0.317 → 2.0.341, `@fluentui/react-datepicker-compat` → 0.6.38. `@fluentui/react` stays pinned at 8.106.4 until Decision A and B are closed, then it is removed.

Lint debt: 414 warnings (ProjectWebParts 111, shared-library 85, ProgramWebParts 85, ProjectExtensions 55, PortfolioExtensions 40, PortfolioWebParts 38). Top rules: `no-floating-promises` 79, `no-console` 74, `no-unused-vars` 72, `no-useless-catch` 29, `require-await` 26, `no-lone-blocks` 24, `no-new-null` 20, `no-empty` 17, `no-void` 14, `require-atomic-updates` 10. Three rules were relaxed to `warn` in Phase 1 pending this clean-up: `no-floating-promises`, `no-use-before-define`, `require-atomic-updates`.

## Baselines (recorded at slice 0, 2026-09-22)

Measured before the version bump, so the end of the phase has something to compare against. Sizes and
coverage come from the 2026-09-21 `rush rebuild`; re-measure all four tables from the slice 0 rebuild
and from the last slice's rebuild.

Package sizes, the `.sppkg` each solution declares in its own `config/package-solution.json` (the
channel and `-arkiv` packages next to them are stale local output and are not part of the baseline).
"Before" is the 2026-09-21 rebuild on Fluent 9.72.11, "after" the 2026-09-22 rebuild on 9.74.8, so the
delta is the cost of slice 0 alone:

| Solution | Package | Before | After slice 0 | Delta |
|---|---|---|---|---|
| shared-library | `pp-shared-library.sppkg` | 1 996 KB | 2 024 KB | +28 KB (+1.4 %) |
| ProjectWebParts | `pp-project-web-parts.sppkg` | 7 064 KB | 7 160 KB | +96 KB (+1.4 %) |
| PortfolioWebParts | `pp-portfolio-web-parts.sppkg` | 10 068 KB | 10 188 KB | +120 KB (+1.2 %) |
| ProgramWebParts | `pp-program-web-parts.sppkg` | 4 780 KB | 4 828 KB | +48 KB (+1.0 %) |
| ProjectExtensions | `pp-project-extensions.sppkg` | 1 284 KB | 1 296 KB | +12 KB (+0.9 %) |
| PortfolioExtensions | `pp-portfolio-extensions.sppkg` | 1 456 KB | 1 456 KB | 0 KB |
| **Total** | | **26 648 KB** | **26 952 KB** | **+304 KB (+1.1 %)** |

Test coverage, from each solution's `jest-output/coverage/coverage-summary.json`. These are the values
Decision D's first thresholds are set from in slice 3; ProgramWebParts is high only because it has few
instrumented files, not because it is well tested:

| Solution | Test files | Statements | Branches | Functions | Lines |
|---|---|---|---|---|---|
| shared-library | 7 | 11.33 % (2 435/21 478) | 33.26 % | 10.14 % | 11.33 % |
| ProjectWebParts | 1 | 6.56 % (1 487/22 640) | 1.31 % | 0.66 % | 6.56 % |
| PortfolioWebParts | 1 | 1.76 % (332/18 863) | 3.63 % | 0.94 % | 1.76 % |
| ProgramWebParts | 1 | 29.89 % (1 807/6 045) | 32.60 % | 7.69 % | 29.89 % |
| ProjectExtensions | 1 | 0.18 % (22/11 995) | 2.45 % | 0.83 % | 0.18 % |
| PortfolioExtensions | 1 | 0.27 % (36/13 121) | 2.97 % | 2.00 % | 0.27 % |

Twelve test files in total: one component test per solution plus six unit tests and one component test
in the shared library, and `shared-library/test/runtime/termStore.runtime.test.mjs`.

Lint warnings the build tolerates, counted from each solution's `release/analysis-logs/lint.sarif`
after the slice 0 `rush rebuild` (written by the lint task inside `heft build`; zero errors anywhere).
384, not the 414 in the inventory above, which came from a `rush lint` run rather than from the build:

| Solution | Warnings |
|---|---|
| ProjectWebParts | 117 |
| shared-library | 92 |
| ProjectExtensions | 55 |
| PortfolioWebParts | 54 |
| PortfolioExtensions | 40 |
| ProgramWebParts | 26 |
| **Total** | **384** |

By rule: `no-console` 83, `no-floating-promises` 75, `no-unused-vars` 60, `no-useless-catch` 24,
`no-lone-blocks` 23, `require-await` 23, `no-new-null` 15, `no-empty` 15, `no-void` 12,
`require-atomic-updates` 10, `no-unused-expressions` 10, `pair-react-dom-render-unmount` 9. Decision E
pays these down in the files each slice touches, so this table is the number to watch falling.

v8 import counts were re-counted at slice 0 and match the inventory table exactly (214 files), so the
inventory is current.

## Decisions

### A. Lists: one shared `List` on v8 for now, converted last, behind its own interface (decided; ratified 2026-09-29)

44 files touch `DetailsList`; almost all of them do so through two hubs, `PortfolioWebParts/src/components/List` (`ShimmeredDetailsList` with grouping, sticky header, selection, column resize and context menus) and the `ItemColumn` renderers in the shared library. v9's `DataGrid` has sorting, selection and resizable columns but no grouping, no sticky header and no built-in virtualization, and Microsoft's list replacement is still `@fluentui/react-list-preview`. Rewriting the portfolio list on `DataGrid` today would lose grouping or force a home-made one.

Rule: convert everything around the lists first (toolbars, panels, column pickers, renderers) so that `DetailsList` is reached only through `PortfolioWebParts/src/components/List` and the equivalent in the shared library, with `IColumn` confined to those modules behind our own `ProjectColumn`/`ProjectContentColumn` types. The last slice then decides per list: `DataGrid` where the list needs none of grouping, sticky header or virtualization (most `DynamicList` views, admin lists), and the v8 `DetailsList` kept inside the one shared wrapper where it does, until v9 has parity. `@fluentui/react` remains a dependency of the shared library only, in that case.

**Ratified after slice 7 (2026-09-29).** Every list outside the hub is on the shared v9
`DataGridList`; the hub in `PortfolioWebParts/src/components/List` stays on v8 for this phase, with
its four `Selection`-as-state files. Its conversion — grouping emulated with flattened group rows and
expand/collapse state, a CSS sticky header carrying the title, search and toolbar, selection as row
ids in both reducers, marquee dropped — is **its own later phase**, started only after slice 3b has
put tests around the hub, which has none today. Consequence for the sentence above: `@fluentui/react`
also remains a dependency of PortfolioWebParts in this phase, for the hub alone; the definition of
done is amended to say so.

### B. People picker: one shared wrapper, v8 inside (decided; confirmed the hard way 2026-09-25)

Seven files use `NormalPeoplePicker`. v9 has no people picker; the options are the PnP `PeoplePicker` (also v8 inside), a `TagPicker`-based component with our own Graph/people search, or keeping v8. Rule: create one `PeoplePicker` component in the shared library with a v9-shaped API (`selected`, `onChange`, `multi`, resolver), implemented on the v8 `NormalPeoplePicker` for now, and route all seven call sites through it. Replacing the inside later is a one-file change.

**Amended when the slice was executed.** Two premises were wrong. First, only **two** files render
`NormalPeoplePicker` — `User.tsx` and `UserMulti.tsx`, which are identical apart from an icon and an
item limit. The other five use `IPersonaProps` as a *data model* passed between the adapter, the
field value map, the edit panel's model and two renderers, the same pattern as `IContextualMenuItem`
and `IProgressIndicatorProps` in slice 4; it is replaced by `IPersonaItem` in `shared-library/src/types`.

Second, "v9 has no people picker" looked out of date: `@fluentui/react-tag-picker` ships inside
`@fluentui/react-components@9.74.8` and exports `TagPicker` with its control, group, input, list and
option parts — option (b) of the three weighed above. The wrapper was therefore built on `TagPicker`
first, to avoid doing the work twice.

**That did not survive contact with the stack, and the rule stands as written.** Typing into the
picker sends it into an endless render loop: 100% CPU, the Jest worker dies with
`Jest worker encountered 4 child process exceptions, exceeding retry limit`. Static rendering is
fine — a probe covering empty, multi-with-selection and single-with-selection passes — and the loop
appears only on input. Two plausible causes in our own code were found and fixed along the way and
neither was it:

- `TagPickerInput` must stay **uncontrolled**. `useTagPickerInput` does `const { value = contextValue } = fieldProps`
  and also calls the picker context's `setValue`, so supplying `value` gives it two sources of truth.
- a `TagPickerOption` with an empty `value` collides in the option registry, which is easy to hit
  because the no-results entry renders in the window between the keystroke and the search answering.

The loop persisted with both fixed, and then reproduced on **Fluent's own documented `TagPicker`
usage with none of our code in it**. The cause is almost certainly the React version: SPFx 1.23 pins
React 17 and `TagPicker` is built against React 18 semantics. Retry when the SPFx React version
moves; the component carries a note saying so.

So the wrapper is the v8 `NormalPeoplePicker` behind the v9-shaped API, exactly as the rule says.
The API and `IPersonaItem` are unaffected, and swapping the inside remains the one-file change.

Worth knowing for the slices ahead: a v9 component shipping in `@fluentui/react-components` is not
by itself evidence that it works here. Anything built on `@fluentui/react-combobox` needs an
interaction-level test before it is adopted, not just a render.

**Generalised in slice 6 (2026-09-28).** The v9 `Dropdown` does the same thing as `TagPicker`: it
renders, and the moment it *opens* it loops and kills the Jest worker, in Fluent's own documented form
with nothing of ours in it. `Dropdown`, `Combobox` and `TagPicker` are all built on
`@fluentui/react-combobox`, so treat the family as unusable in the harness on React 17. The data type
dropdown in `ColumnDataTypeField` therefore stays on the v8 `Dropdown`, behind our own option type, and
the component says so.

This also withdraws the sentence above about `ResponsibleField`: its v9 `Combobox` is in production,
but it has no test, and nothing here shows that it survives being opened. It should be verified by
hand on the test tenant, and if it misbehaves it is the same hold-out as this one.

**Corrected by production evidence (2026-09-29).** The user tested the column form on the test
tenant: the v9 `Combobox` for column visibility, in the same drawer, works. So the loop is a
**Jest/jsdom artefact on React 17**, not a product defect, and the rule becomes: the combobox family
— and, found the same day, the v9 `Menu` popover — is unusable *in the harness* but fine in the
browser. Consequences: the data type dropdown is now the v9 `Dropdown` after all, because the v8
one rendered its list in the v8 layer underneath the v9 drawer (the user's bug report); its test
keeps every case that does not open it, and opening is a manual check. The wrapper around the people
picker stays on v8 only because it is a full picker, not because v9's `TagPicker` is known to fail in
the browser — that is now an open question, not a settled one.

### C. v8 is removed from a solution when its last v8 import is gone, and checked by the build (decided)

Each solution drops `@fluentui/react` from `package.json` the moment `grep -rl "from '@fluentui/react'" src` is empty. Until every solution is free, the shared library keeps the dependency (Decisions A and B). The packaging proof in `Install/Build-Release.ps1` gains a check that fails when a bundle still contains Fabric core classes once `fabric.min.css` has been removed (extend the existing hashed-CSS guard's pattern list). The compat alias for `office-ui-fabric-react` and the `fabric.min.css` alias are deleted together with `pzl-spfx-components`, which is the first hygiene slice.

### D. Tests before conversion, and full component coverage as a workstream of this phase (decided)

The harness from Phase 2 is ready. For every slice, the agent first writes component tests for the components it will convert, against the v8 implementation, and only then converts. Tests must not assert on Fluent internals (class names, DOM structure); roles, names and texts survive the switch. The slice is done when the same tests pass on v9 and the browser suite is green on the test channel.

Because the conversion touches nearly every component, this phase also carries the goal of complete component coverage, not only for the files a slice converts. Targets, checked at the lint close-out:

| Level | Target | How |
|---|---|---|
| Web part root components (20 web parts, 9 extension components) | One test file each: renders with a mocked data adapter and minimal SPFx context, asserts the main UI, and exercises every toolbar command or primary action once (click, type, select, open and close) | `jest.mock` of the solution's data adapter and hooks; roles and Norwegian texts as selectors |
| Interactive components (panels, dialogs, pickers, menus, editors, matrices, timeline, list toolbars) | Every user interaction the component offers has an assertion on its effect: callback called with the right payload, state visible in the UI, dialog opened and closed, validation message shown | `@testing-library/user-event`; one file per feature folder |
| Hooks and pure logic (`useXxx`, reducers, mappers, formatters) | Unit tests for every branch that decides what the user sees | Plain Jest; `renderHook` for hooks; no PnPjs (stand-ins, see Phase 2) |
| Data adapters and services | Runtime contract tests against real PnPjs 4 with a fake transport, as `shared-library/test/runtime` does, for every method that composes queries | `node --test`, extended to the consumers that own adapters |
| Navigation and cross-page flows | Playwright, not Jest: hub to project via the project list, phase change dialog open and cancel, view switching in the portfolio overview, program site pages, and the first write flows with cleanup (upload through the dynamic list, copy a document template) | `e2e/tests/smoke` plus a new `e2e/tests/flows` folder; `E2E_PROGRAM_URL` added |

Coverage is measured, not guessed: Heft writes `jest-output/coverage` for every solution already; slice 0 records the baseline per solution, slice 3 sets the first thresholds in `pp365-jest-config` at the values then reached, and each later slice may only raise them. Components already on v9 (not touched by any conversion slice) are covered in a dedicated pass, slice 3b, so the workstream does not depend on the conversion order.

Flaky or slow tests are a defect of the test: the first Fluent import in a test file costs 15 to 45 seconds, so tests are grouped per feature folder, and any test that needs a retry is fixed or removed, never retried.

### H. `BasePanel` keeps its name; its props are modernised at the end of slice 4 (decided 2026-09-23)

`BasePanel` now renders a v9 `OverlayDrawer`, which raises the question of renaming it to
`BaseDrawer` and sweeping "Panel" out of the vocabulary. Measured first: **610 occurrences of "Panel"
across 154 files**, 8 stylesheets and about ten localisation keys (`FilterPanelEmptyMessage`,
`NewRiskActionPanelTitle`, `EditViewColumnsPanelHeaderText` and friends), plus 15 uses of
`AccordionPanel`, which is a Fluent v9 component name and must not be swept up.

Rule, in three parts:

1. **Keep the name `BasePanel`.** It is a domain name — the side panel every feature opens — not a
   claim about the implementation. It just absorbed an entire framework swap with two line changes at
   its call sites, which is the abstraction doing its job; renaming it to match the current
   implementation would leak that detail into the name and invite another rename at Fluent v10. The
   Norwegian UI calls these panels as well.
2. **Modernise the props once every panel routes through it**, as the closing step of slice 4:
   `isOpen` → `open`, `onDismiss` → `onClose`, and the `onRenderBody` / `onRenderFooterContent`
   render props → children and a `footer` slot. Render props for body content are a v8 idiom. Roughly
   ten call sites, mechanical, and cheaper in one pass than piecemeal later. Keeping the v8 names
   during the conversion is what made it cheap; keeping them forever is not the goal.
3. **No repo-wide "Panel" → "Drawer" rename.** A 610-occurrence cosmetic diff inside a functional
   migration is exactly what the Phase 1 handoff warns against, and the localisation keys would drag
   the triad in every solution through `validate-loc` for no user-visible benefit.

Timing is part of the decision: eight panels still render a v8 `Panel`, so any renaming before they
are converted would produce names that describe the wrong thing.

### I. The six list-bearing web parts: what to share, and when (analysed 2026-09-28; decision pending)

Asked because slice 6 touches the lists: PortfolioOverview, PortfolioAggregation, DynamicList,
ProjectList (list view), the timeline list and IdeaModule all "do a list", some share components,
some do not. Measured on 2026-09-28 at `1e1820e4` before anything in slice 6 was changed.

#### What is there today

| Web part | Renders | State | Grouping | Selection | Column management | Tests |
|---|---|---|---|---|---|---|
| PortfolioOverview | **v8** `List` hub (`ShimmeredDetailsList`, sticky header, marquee) | Redux Toolkit reducer, 381 lines | yes | multi | own `ColumnContextMenu` (sort, custom sorts, group, add/edit column), `ColumnFormPanel`, `ViewFormPanel`; `EditViewColumnsPanel` shared with aggregation | 2 files |
| PortfolioAggregation | the same v8 hub | reducer, 748 lines | yes | multi | its own parallel set of the three, against a different list and model | 0 |
| IdeaModule | **not a list** — a nav shell that embeds `<PortfolioAggregation>` | `useState` | inherits | inherits | inherits | 0 |
| DynamicList | **v9** `Table` + `useTableFeatures` (sort, selection, column sizing), four views | hooks | no | multi | own `ColumnContextMenu` — group-by only | 0 |
| ProjectList (list view) | **v9** `DataGrid` (sortable, resizable) | `useState` | no | none | none | 0 |
| Timeline list | **v9** `DataGrid` (sortable, resizable, multiselect) | `useState` | no | multi | none | 0 |

Two facts fall out of the table that the plan did not know:

- **Three of the six are already on v9**, and two of them run `DataGrid` with sorting, column resize and
  multiselect in production on React 17. The React 17 concern about `DataGrid` is answered; only
  components newer than the React 18 cutover (as `TagPicker` was, slice 5) still need proving.
- The repository has **three list implementations for one job**: the v8 hub, `DataGrid` twice, and
  `useTableFeatures` once. Decision A's "one shared list" is the v8 hub; nothing currently makes the
  v9 sites share anything with it or with each other.

#### What is already shared, and what only looks shared

Shared, in the shared library, used by all the list-bearing web parts that need them: `Toolbar`,
`FilterPanel`, `CustomEditPanel`, `ListMenuItem`, and the **cell-renderer registry**
(`ColumnRenderComponentRegistry`, `renderItemColumn`, `useColumnRenderComponentRegistry`).
PortfolioOverview, PortfolioAggregation *and* DynamicList all render cells through that registry.
The PortfolioWebParts `List/ItemColumn` folder is not a second renderer tree: it holds five
portfolio-specific renderers (`ConfigColumn`, `HubColumn`, `ProjectInformationColumn`,
`StatusReportColumn`, `TitleColumn`) that register themselves into the shared registry. Six
directories in it that made it look like a duplicate of the shared tree were **empty** — leftovers
from the move to the shared library, never tracked by git — and were deleted on 2026-09-28. The
slice 6 handoff's "two parallel renderer trees" was wrong; the merge it asked for is already the
architecture.

Not shared: the three grids; the three column context menus (two rich, one group-by only); the
overview/aggregation panel pair; the `ProjectColumn` and `ProjectContentColumn` models.

The overview/aggregation pair deserves precision, because it is the one that *looks* like copy-paste.
It is not. `useColumnContextMenu` differs in 94 of ~160 lines, `useColumnFormPanel` in 139 of ~180,
`useViewFormPanel` in 132 of ~110. They target different lists (`PROJECT_COLUMNS` and
`PORTFOLIO_VIEWS` against `PROJECT_CONTENT_COLUMNS` and `DATA_SOURCES`), different models, different
field sets and different save paths. What they share is shape. Merging them yields one component with
two modes, which is not simpler than two components with one mode each.

#### Candidates

| # | Candidate | For | Against | When |
|---|---|---|---|---|
| 1 | Merge the two `ItemColumn` trees | — | Already merged: the registry is the merge. | Done. Nothing to do beyond the empty directories, removed. |
| 2 | `IProjectColumn` stops extending v8 `IColumn` | Frees the type from ~19 files; is the migration | Fallout in sorting, grouping and the column panels, found by the compiler | **Now — slice 6.** This is the migration, not a refactor. |
| 3 | One shared v9 grid wrapper (ProjectList list view + timeline list, later the hub) | Their hooks already return the same shape (`columns`, `columnSizingOptions`, `defaultSortState`); one place for sort/resize/selection; it is what the hub would convert *into* under Decision A, and cheaper to build from two working `DataGrid` sites than from the v8 hub | Two call sites with zero tests, so Decision D says tests come first; DynamicList is on a different primitive (`useTableFeatures`) and would stay out | **First act of slice 7**, when the hub's fate is decided — not before, and not as part of slice 6. |
| 4 | Parameterise the overview/aggregation panels and context menu | ~40% of the lines are structural | The other 60% is the actual behaviour; a two-mode component is harder to read and test than two; no third consumer exists to justify the abstraction | **After the migration, if a third consumer appears.** Probably never. |
| 5 | Fold DynamicList's group-by-only menu into the rich context menu | One menu | DynamicList deliberately exposes less; it has no column management to offer | No. Revisit only if DynamicList gains column management. |
| 6 | Unify `ProjectColumn` and `ProjectContentColumn` | One model | Different lists, different visibility flags, different semantics | No. But both take candidate 2. |
| 7 | Move the four state models to one pattern (reducer vs hooks) | Consistency | Pure churn on working code with no tests | No. |
| 8 | Anything in IdeaModule | — | It is a host, not a list; it gets whatever PortfolioAggregation gets | Nothing. |

#### Verdict on timing

**Wait until after the migration, with two exceptions that *are* the migration: candidate 2 in
slice 6, and candidate 3 as the opening of slice 7.**

The reasoning is the phase's own rules. The release note for this phase says "no intended
functional difference", and a structural merge of working components is a functional risk by
definition. Decision D requires tests before conversion; five of the six web parts have none, and the
v8 hub and the renderer registry have none, so any merge now starts by writing the tests the
migration would have written anyway — doing it inside the migration only interleaves two kinds of
change in one diff. And the three v9 sites are stable; touching them now to share code, then again
when the hub converts, churns them twice.

The two exceptions are not really exceptions. Dropping `extends IColumn` is the slice 6 leverage
point and is a type change, not a component merge. A shared v9 grid is the thing the hub converts
into if Decision A ever lets it convert — building it first, from the two sites that already work,
means the hub's conversion in slice 7 is a move onto proven ground rather than a rewrite. Whether the
hub converts at all is still Decision A's per-list call (grouping and the sticky header are the
blockers, unchanged), and that is slice 7's question.

### G. File type icons keep Fluent v8, and the definition of done makes room for it (decided 2026-09-23)

`@fluentui/react-file-type-icons` produces props for the Fluent UI v8 `Icon`, and Fluent v9 has no
file-type icon equivalent. Five render sites depend on it: `FileNameColumn` in the shared library,
and `TemplateItem.getIconProps()` plus the three document template dialog screens in
ProjectExtensions. The alternatives were to map file types onto the v9 catalog, which loses the
distinct coloured Office glyphs, or to render the CDN images directly via the package's own
`getFileTypeIconAsUrl`, which keeps them but is new code.

Rule: **keep them as they are.** The correct, coloured file type icons are wanted, so
`@fluentui/react` stays a dependency of shared-library and ProjectExtensions for that purpose alone,
alongside the list and people picker hold-outs of Decisions A and B. The same applies to
`shared-library/src/icons/index.tsx`, whose v8 `Icon` is the deliberate UI Fabric fallback behind
`getFluentIconWithFallback`. If the v8 dependency later becomes worth removing, `getFileTypeIconAsUrl`
is the route that preserves the glyphs.

### E. Lint debt is paid in the files a slice touches, and the three relaxed rules return to `error` at the end (decided)

No separate lint sweep. When a file is converted, its warnings are fixed in the same commit (`no-console` becomes `Logger`, `no-floating-promises` gets `void` or `await`, unused variables go). At the end of the phase the three relaxed rules in `SharePointFramework/.eslint-config/index.js` are set back to `error`, and `allowWarningsInSuccessfulBuild` in `common/config/rush/command-line.json` is reconsidered.

### F. Fluent v9 versions are bumped first, alone (decided)

Slice 0 bumps `@fluentui/react-components`, `@fluentui/react-icons` and `@fluentui/react-datepicker-compat` to the versions above in all six solutions in one commit, with `rush update` and a green CI run, before any conversion. Version drift and behaviour changes are then separable from conversion changes.

## Slices and order

Each slice is one PR-sized commit series on this branch, verified by `rush rebuild` (tests included), the packaging proof, and a green test-channel run. Order chosen to remove crutches early and to finish with the hard, contained pieces.

| # | Slice | Scope | Removes |
|---|---|---|---|
| 0 | Version bump | Fluent v9 packages to current, all six solutions | version drift |
| 1 | `format` and ids | Shared `format` helper; replace all 72 `format` imports and the 9 `getId`/`useId` imports | `@uifabric/utilities`, `@fluentui/react-hooks`, `lib/Utilities` imports |
| 2 | Hygiene | Replace `pzl-spfx-components` (1 file), `@uifabric/file-type-icons` (1 file) and `pzl-react-reusable-components` (`useConfirmationDialog` → a v9 `Dialog` in the shared library, 2 files; drop the dead dependency in ProgramWebParts); delete the two webpack aliases; remove `fabric.min.css` from the five web parts after replacing the `ms-Grid` mixins in `SummarySection.module.scss` with flex/grid CSS | two aliases, `fabric.min.css`, `@uifabric/*`, a duplicate Fluent v8+v9+React copy |
| 3 | Easy components | `Icon`, `MessageBar`, `Shimmer`, form controls (57 files across all solutions), tests first per Decision D | most v8 imports in ProjectExtensions, PortfolioExtensions, ProgramWebParts; those three solutions drop `@fluentui/react` |
| 3b | Coverage pass | Tests for every web part root and interactive component not touched by slices 3 to 7 (already on v9), hook and adapter tests, first coverage thresholds; `E2E_PROGRAM_URL` and the `flows` folder in the browser suite | untested components |
| 4 | Panels and menus | `Panel` → `OverlayDrawer` (18), `ContextualMenu`/`Callout` → `Menu`/`Popover` (10), `Dialog`/`Breadcrumb`/`ProgressIndicator` (6) | v8 overlay components |
| 5 | People picker | Shared wrapper per Decision B, seven call sites | scattered `NormalPeoplePicker` |
| 6 | Lists, part 1 | Confine `DetailsList`/`IColumn` to the two hubs; convert renderers and toolbars around them; `DataGrid` for lists that need no grouping/sticky. **Measured and handed off: `docs/plans/fluent-v9-migration/HANDOFF-slice-6.md`** | `IColumn` outside the hubs |
| 7 | Lists, part 2 | Decide per remaining list (`DataGrid` vs wrapped v8); `@fluentui/react` removed from every solution that is free | v8 in the web part solutions |
| 8 | Close-out | **Decided 2026-09-29:** the timeline list fits its columns to the web part (a `DataGridList` feature); the status page's section tabs go to CSS `position: sticky`; `PropertyFieldColorConfiguration` is deleted (unreferenced since slice 3); the four type-only v8 imports left in the shared library (`ITag`, `IObjectWithKey`, `IIconProps`, `DayOfWeek`) become our own types. Then the close-out proper: relaxed rules back to `error`, `allowWarningsInSuccessfulBuild` revisited, coverage thresholds enforced in `pp365-jest-config`, `Redux Toolkit` 2 / `xlsx` 0.18 / React-15-era peers with a one-line verdict each, the definition of done and the release note. The column form panel was enabled in `1e1820e4`. | tolerated warnings, the tail of v8 |

Slices 3 to 6 are per solution internally: shared-library first (consumers compile against its `lib`), then ProjectExtensions, PortfolioExtensions, ProgramWebParts, ProjectWebParts, PortfolioWebParts.

## Rules for the executing agent

- Read `AGENTS.md`, the `pp365-toolchain` and `pp365-testing` skills, and this plan before the first edit. The Phase 1 and Phase 2 plans in `docs/plans` hold the traps already hit; do not rediscover them.
- Never run git; the developer commits from your messages. End every batch with a semantic commit message.
- Never bypass Rush: dependency changes go in `package.json` plus `rush update` from the root.
- Tests first (Decision D); `jest.mock` above the imports; no `@pnp/*` in tests.
- Convert a component fully or not at all: no file may import both `@fluentui/react` and `@fluentui/react-components` for the same purpose after its slice.
- Wrap new v9 surfaces (drawers, dialogs, menus, popovers) in `IdPrefixProvider` + `FluentProvider` with `customLightTheme`, as the existing v9 components do; see `.development-guide/spfx/kodemonster.md` and the flicker notes in `docs/plans/fluent-icons.md`.
- Keep bundle discipline: `Build-Release.ps1`'s packaging proof must stay green; check `grep -c 'react-calendar-timeline_'` is 0 after touching webpack configuration.
- After each slice: `rush rebuild` green, push, wait for the test-channel run including the browser suite, then manual check of the converted surfaces on the test tenant using the smoke issue templates for the affected solution.

## Risks

- Visual regressions that no test sees: layout and spacing differ between v8 and v9 controls. Mitigation: Decision D's interaction tests plus a manual look per slice; visual snapshot tests are worth adding for the status page and the portfolio overview once the lists are done.
- `DetailsList` features without a v9 equivalent (Decision A): the wrapper strategy caps the risk but leaves v8 alive in the shared library until v9 catches up.
- Bundle size: v8 and v9 coexist longer in the shared library; measure the six `.sppkg` sizes at slice 0 and at the end.
- Budget: the first agents that were to write component tests were killed by the account session limit in Phase 2. Prefer few, focused agents per slice over broad fan-out.

## Definition of done

`grep -rl "from '@fluentui/react'" SharePointFramework/*/src` lists only the deliberate hold-outs — the shared list wrapper (Decision A), the people picker (Decision B), the file type icon render sites and the UI Fabric icon fallback (Decision G) — and `@fluentui/react` is a dependency of shared-library, ProjectExtensions and — for the hub alone, per Decision A as ratified — PortfolioWebParts only, for those reasons; no `@uifabric/*`, `pzl-spfx-components`, `fabric.min.css` or compat aliases remain; the three relaxed lint rules are `error` and `rush rebuild` reports zero warnings, or a documented, short allow-list; every web part root and interactive component has a test file meeting the Decision D targets, coverage thresholds are enforced in `pp365-jest-config` at or above the slice 3 baseline, the browser suite includes a program site, the navigation flows and two write flows; the release notes for the version carrying this phase describe it as a technical change with no intended functional difference.

## Slice log

### Slice 0 — version bump (2026-09-22)

Done. `@fluentui/react-components` `~9.72.10` → `~9.74.8`, `@fluentui/react-icons` `~2.0.317` →
`~2.0.341` and `@fluentui/react-datepicker-compat` `~0.6.22` → `~0.6.38` in all six solutions; no
source file touched. All three are the current `latest` on npm, and React 17 is inside every peer
range.

The focus-management pins in `common/config/rush/pnpm-config.json` were raised with them, which is
the re-evaluation the Phase 1 plan deferred to this phase (`@fluentui/react-tabster` 9.26.13 →
9.26.18, `keyborg` 2.6.0 → 2.14.1, `tabster` 8.7.0 → 8.8.1). Fluent 9.74.8 asks for
`react-tabster ^9.26.18`, which in turn asks for `keyborg ^2.14.1` and `tabster ^8.8.0`; left at the
old values the overrides would have forced the whole focus stack *below* its own minimums, since a
pnpm override wins whether or not it satisfies the range. `keyborg` 3.x is deliberately skipped:
react-tabster still asks for the 2.x line. The rule is now a comment in the file — re-check the three
pins on every Fluent v9 bump.

Checked before the bump, so the build does not have to find it:

- **The CommonJS build moves from `.js` to `.cjs`.** `@fluentui/react-components@9.74.8` and every
  sub-package now publish `lib-commonjs/index.cjs`, `main` points at it, and the `"node"` export
  condition is gone. Harmless in all three consumers: webpack takes the `import` condition
  (`lib/index.js`) as before; TypeScript is on `moduleResolution: "node"`, ignores `exports`, and
  still finds the unchanged root `typings`; Jest takes the `require` condition, has `cjs` first in
  the rig's `moduleFileExtensions`, and never transformed these files anyway (no `transform` pattern
  matches `.cjs`, so `transformIgnorePatterns` not covering it is moot).
- **Every icon name still exists.** All 301 distinct symbols imported from `@fluentui/react-icons`
  across the six solutions resolve in 2.0.341, `iconCatalog.ts` included. An icon import is a named
  import, so a removal would be a compile error rather than a missing glyph.
- **`Alert` survives.** The three `ProjectExtensions` files that import `Alert` from
  `@fluentui/react-components/unstable` still compile: `/unstable` re-exports it in 9.74.8 and
  `@fluentui/react-alert`'s public types are byte-identical to the installed version.

Two things the lockfile made visible while checking the bump:

- **The bump collapsed a duplicate Fluent v9 in the lockfile, but that bought nothing in the
  bundles.** `@pnp/spfx-controls-react` 3.25.0 and `@microsoft/sp-dialog` both pull
  `@fluentui/react-migration-v8-v9`, which requires `@fluentui/react-components ^9.74.7`; against the
  old `~9.72.10` that could not dedupe, so the lockfile carried 9.72.11 *and* 9.74.7. `~9.74.8`
  satisfies both and `rush update` collapsed three copies (9.37.4, 9.72.11, 9.74.7) into two
  (9.37.4, 9.74.8); `@fluentui/react-tabster` 9.26.18, `keyborg` 2.14.1 and `tabster` 8.8.1 each
  resolved to exactly one copy. The remaining 9.37.4 is `pzl-react-reusable-components`, which slice 2
  removes. The predicted *bundle* win did not happen, and the reason is worth recording so nobody
  chases it again: `react-migration-v8-v9` does not appear in any `dist` bundle at all. The PnP
  controls this repo actually uses never reach it, so webpack tree-shakes it, and the 9.74.7 copy only
  ever existed in `node_modules`. Every bundle contained exactly one Fluent v9 before and after
  (`fui-FluentProvider` occurs once per bundle). The dedupe is still worth having — one copy on disk,
  and no way for a future control to drag in a second tabster — but it is hygiene, not size.
- **The packages grew 1.1 %,** which is Fluent's own growth over two minors, not a regression. The
  eight sub-packages this repo leans on hardest grew 19.6 % between the 9.72 and 9.74 dependency sets
  (`react-menu` +37 KB, `react-positioning` +24 KB, `react-tree` +24 KB, `react-tabster` +17 KB,
  `react-motion` +15 KB, `react-button` +14 KB, `react-dialog` +12 KB, `react-accordion` +8 KB
  packed); tree-shaking means only a slice of that reaches a bundle, which is the +0.9 to +1.4 % seen
  per solution. If bundle size becomes a goal in its own right, the levers are slice 2
  (`pzl-react-reusable-components` carries a whole second React + Fluent v8 + Fluent v9) and slice 7
  (dropping v8), not the Fluent version.
  `@fluentui/react-icons` was already resolving to 2.0.341 under `~2.0.317`, so that bump only moves
  the declared floor up to what is installed; `@fluentui/react-datepicker-compat` was likewise already
  at 0.6.37. `@fluentui/react-icons@2.0.314` under `@microsoft/sp-property-pane` stays separate and
  does not matter — SPFx is a page-provided external.
- **`pzl-react-reusable-components` 0.3.4 is a third Fluent copy** and is not in the hygiene list
  above (it is a different package from `pzl-spfx-components`). It declares, as hard dependencies and
  all exact, `@fluentui/react-components` 9.37.4, `@fluentui/react` 8.97.0, `react`/`react-dom` 17.0.2,
  `react-markdown` 8.0.3 and `underscore` 1.13.6 — so PortfolioWebParts bundles a second React and a
  second Fluent v8 as well. It is used in exactly two files (`PortfolioAggregation` and
  `PortfolioOverview` `ColumnFormPanelFooter`) for one hook, `useConfirmationDialog`, whose whole job
  is a confirm dialog with two buttons. ProgramWebParts declares it and never imports it. Replacing it
  with a v9 `Dialog` in the shared library is now part of slice 2.

`rush rebuild` is green: 8 min 46 s, exit 0, 11 operations (5 clean, 6 with warnings), tests included,
zero errors. Both packaging guards hold — no `pp365-*` in any AMD `define([...])` header in any of the
six solutions, `react-calendar-timeline_` is 0 in the timeline bundle and `accordionChevron_<hash>` is
present in the project information bundle, so the CSS-module routing is intact. Coverage is unchanged
from the baseline table, as expected with no source change.

Still open: the visual and focus behaviour of the v9 surfaces already in use, which only a tenant can
show. The tabster bump is the part most likely to surface there, and it affects v9 surfaces only — the
v8 panels the browser suite already opens use v8's own `FocusTrapZone` and are not touched by it.

### Slice 1 — `format` and ids (2026-09-22)

**Done and verified**

Two helpers in the shared library, written test-first per Decision D:

- `shared-library/src/util/format.ts` replaces v8's `format`. Semantics are identical to
  `@fluentui/utilities/lib/string.js` 8.17.2 *including its quirks*, because the strings it formats
  are user-visible: only `null`/`undefined` blank out (`0`, `false` and `''` render), tokens are
  matched as `{digits}` only, and the index is looked up with the token's own digits rather than a
  parsed number, so `{00}` renders empty instead of falling back to argument 0. `format.test.ts`
  (13 cases) asserts each case explicitly *and* differentially against a verbatim copy of the v8
  source kept in the test file as the oracle.
- `shared-library/src/util/getId.ts` replaces v8's `getId`. This is a **deviation from the plan**,
  which expected `useId` from `@fluentui/react-components` to cover every id site. It cannot: v9
  ships only the `useId` *hook* (plus `resetIdsForTests`) and 6 of the 10 id sites are in module
  scope, a class field or a plain function, where a hook is illegal. The counter lives on `window`
  (`__pp365CurrentId__`), as v8's did, because several solutions can be on the same page each with
  its own bundled copy of the library, and a module-local counter would hand out `name0` twice.
  `getId.test.ts`, 5 cases.

`format` is fully migrated: **81 files** across all six solutions, `@fluentui/react` /
`@fluentui/react/lib/Utilities` / `@uifabric/utilities` alike, verified zero leftovers. Consumers
import it from the `pp365-shared-library` barrel, shared-library's own files from the relative `util`
barrel, matching the dominant convention in each. One import was multi-line and was handled.

A trap worth recording: the rewrite script's import regex ended `\s*\n`, which greedily swallowed the
blank line *after* an import statement, so merged imports lost the blank line before the code and
inserted imports landed after it. Caught by reading the output rather than by any tool. Repaired by
normalising the import block in the affected files, on the evidence that 99.3 % of the 595 untouched
files with an import block have exactly one blank line after it and 0.2 % have one inside it. Use
`[ \t]*\n` in any future rewrite script.

**The ten id sites**

Four are inside a component or hook and became `useId` from `@fluentui/react-components`:
`PortfolioWebParts` `PortfolioAggregation/reducer/index.ts`,
`PortfolioOverview/hooks/usePortfolioOverview.ts` and
`PortfolioOverview/ViewFormPanel/ViewFormPanelFooter/index.tsx` (all three were `useId` from
`@fluentui/react-hooks`, a like-for-like swap), plus `ProjectExtensions`
`DocumentTemplateDialog/EditCopyScreen/DocumentTemplateItem/index.tsx`. Six are in module scope, a
class field or a plain function and moved to the shared `getId`: `PortfolioExtensions`
`extensions/templatePackageCatalog/index.tsx`; `ProjectExtensions`
`DocumentTemplateDialog/SelectScreen/columns.tsx`,
`DocumentTemplateDialog/TargetFolderScreen/columns.tsx`, `extensions/projectSetup/index.ts`,
`extensions/templateSelector/index.tsx`; and `shared-library`
`components/PropertyPaneDescription/PropertyPaneDescription.tsx`.

`DocumentTemplateItem` was the one real behaviour change, and it fixed a live defect. The component
uses its two ids as *dispatch keys*, not just DOM ids: `onInputChange` reads `event.target.id` and
compares it against `nameId`/`titleId` to decide whether the edit was a file name or a title. With
`getId` those ids were regenerated on every render, so the inputs' `id` attributes changed on every
keystroke. The component test written first against the v8 implementation proved it — six of its
seven cases passed, and the seventh failed with `name194` → `name196` after a single keypress. Under
`useId` the ids are stable and all seven pass. Nothing user-visible was broken by the old behaviour,
but it was rewriting DOM attributes on every render and was one refactor away from mis-routing an
edit.

**A harness fix this needed**

The first component test could not run at all: `Cannot find module 'data'`. The five consumer
solutions compile with `baseUrl: "src"` plus `paths`, so their sources import siblings bare
(`from 'data'`, `from 'models'`, `from 'components/X'`), TypeScript resolves that at compile time and
emits it unchanged, and Jest had no equivalent. `pp365-jest-config` now sets
`moduleDirectories: ["node_modules", "lib-commonjs"]`, which is the run-time equivalent of `baseUrl`:
node_modules is searched first so real packages still win. Without this, *no* component test in the
five consumers that touches a data adapter or a cross-folder import can run, so slice 3b would have
hit it immediately. shared-library has no `baseUrl` and is unaffected.

**Dependencies dropped**

`@uifabric/utilities` from ProgramWebParts, ProjectExtensions and ProjectWebParts, and
`@fluentui/react-hooks` from PortfolioWebParts — all four were unused once the call sites moved.
`@uifabric/file-type-icons` stays in ProjectExtensions; that is slice 2. `rush update` regenerated
the lockfile.

**Lint debt (Decision E), partly deferred with reasons**

The slice touched 95 files, but 82 of them only had an import line change. Of the 137 warnings in
those files, only 11 are in the 13 files the slice substantively rewrote, and those were dealt with:
two Prettier violations in the new code, an unused `catch` binding, and three floating promises
marked with `void` rather than `await`, since `await` would change timing and this phase is not
allowed a functional change.

Four are deliberately left, because the fix is not behaviour-preserving and belongs to the slice that
rewrites the file: `require-await` on `templateSelector`'s `onInit` and `_ensureDataLoaded` (both
must keep returning a promise — `onInit` is an SPFx override contract and `_ensureDataLoaded` is
declared `Promise<boolean>` and awaited by callers, so dropping `async` would break the type), and
four `pair-react-dom-render-unmount` in `projectSetup`, where the unmount genuinely happens in the
extension's dispose path and the rule cannot see it.

The remaining ~126 warnings sit in six data-layer files (`PortalDataService`, two `SPDataAdapter`s,
`DataAdapter`, `SPDataAdapterBase`, `CopyListData`) that this slice touched only by moving a `format`
import. Paying them down means rewriting error handling and logging in the data layer inside what is
otherwise an import migration, which is exactly the mix the Phase 1 handoff warned about. They are
better taken either as their own commit or in slice 8, and the decision is the maintainer's.

Net movement is only −1 (384 → 383), and the accounting is worth stating plainly: three
`no-floating-promises` and one unused `catch` binding went away, two Prettier violations in the new
code were fixed, and the three `void` operators that fixed the floating promises created three new
`no-void` warnings (12 → 15). That is a deliberate trade rather than a wash — `no-floating-promises`
is one of the three rules Decision E returns to `error` at the end of the phase and `no-void` is not,
so the debt moved from a rule that will fail the build to one that will not. Slice 8 should decide
whether `no-void` stays enabled at all, given Decision E prescribes `void` as the fix.

A second trap, same family as the first: the import rewrite left a handful of files with
non-Prettier-canonical import formatting, which surfaced as 11 `prettier/prettier` warnings rather
than as anything visible. Running the repo's own Prettier over the 95 touched files cleared them.
Prettier only — never `eslint --fix` across the tree, per the `dot-notation` incident in the Phase 1
handoff.

**Verification**

`rush rebuild` exit 0 in 7 min 47 s, 11 operations (5 clean, 6 with warnings), **146 tests pass, 0
fail**, zero errors. Both packaging guards hold: no `pp365-*` external in any AMD header in any of
the six solutions, `react-calendar-timeline_` is 0 in the timeline bundle and `accordionChevron_<hash>`
is present in the project information bundle. Package sizes are unchanged against slice 0 except
ProjectExtensions, which drops 4 KB with `@uifabric/utilities` gone (26 948 KB total, −4 KB).

### Slice 2 — hygiene (2026-09-22)

Three of the five items turned out to be smaller than the plan assumed, and one assumption in the
plan was simply wrong. Worth reading before trusting the remaining slice descriptions.

**`fabric.min.css` was already dead, and `SummarySection.module.scss` never needed rewriting.**
The plan said to remove the five `fabric.min.css` imports *after* replacing the `ms-Grid` mixins in
`SummarySection.module.scss` with flex/grid CSS. Those are two unrelated things. The `ms-Grid`,
`ms-sm12` and `ms-xl8` in that file are **Sass mixins** from `dist/sass/References.scss`, which the
compiler inlines — the built `SummarySection.module.scss.css` contains the emitted `float`,
`width: 66.6666666667%` and clearfix rules scoped to the hashed module classes, with no runtime
dependency on anything. `fabric.min.css` is a separate, **runtime** stylesheet, and it has not been
loaded since the Heft migration: `@fluentui/react` 8.106.4 declares
`"sideEffects": ["*.scss*", "lib/version.js"]`, `.css` is not in that list, so webpack 5 tree-shakes a
CSS-only import of it away. Verified in the output rather than argued: no bundle in any solution
contains fabric-core CSS text (`ms-bgColor-themePrimary`, `.ms-Grid{`, the Fabric licence header), and
the five web parts that imported it are no different from the one that did not. Removing the imports
is therefore a provable no-op, the Sass file is untouched, and nothing depended on the stylesheet —
which is also why nobody noticed it disappearing in Phase 1.

**`pzl-spfx-components` was dead code, not a conversion.** Its only use was
`{context.state.confirmActionProps && <ConfirmDialog {...context.state.confirmActionProps} />}` in
`ProjectInformation.tsx`. `confirmActionProps` is typed `any`, is declared in the state interface, and
is **never assigned** — not in the reducer, not through a dynamic key, nowhere in the repo. The guard
was always falsy and the dialog never rendered. Import, render line, state field and dependency all
deleted. This also means the `office-ui-fabric-react` compat alias added in Phase 1 existed solely to
resolve imports inside a component that could never render.

**Both webpack aliases are gone**, along with the code that applied them: `COMPAT_ALIASES` (only ever
`office-ui-fabric-react`) and `UNEXPORTED_SUBPATH_ALIASES` (only ever `@fluentui/react/dist/css`) are
removed from all six identical `config/spfx-customize-webpack.js`, with their doc comments. The six
files remain byte-identical and each passes `node --check`.

**`@uifabric/file-type-icons` → `@fluentui/react-file-type-icons` ~8.16.0** in the three
ProjectExtensions files that used it; all four imported symbols (`FileIconType`,
`getFileTypeIconProps`, `IFileTypeIconOptions`, `initializeFileTypeIcons`) exist unchanged in the new
package. **`@uifabric/*` no longer appears anywhere in the repository.**

**`pzl-react-reusable-components` replaced by a shared v9 dialog.** `useConfirmationDialog` now lives
in `shared-library/src/components/ConfirmDialog`, built on the v9 `Dialog` and wrapped in
`IdPrefixProvider` + `FluentProvider` with `customLightTheme` per the repo convention. The API is
deliberately identical to the package it replaces (`[element, getResponse]`, the same
`[label, value, isPrimary]` response tuples), so the two call sites changed only their import. One
behavioural detail was made explicit rather than inherited: dismissing the dialog with Escape or a
click outside resolves `undefined`, not the first response, so a dismissed confirmation can never
carry out a destructive action.

**What the dependency removals bought, measured in the lockfile:** `@fluentui/react-components` went
from two copies to one (9.37.4 gone), `@fluentui/react` from three to two (8.97.0 gone), and the
second React (17.0.2) disappeared entirely. All three were dragged in by
`pzl-react-reusable-components`, which declared them as exact hard dependencies.

**Testing.** `ColumnFormPanelFooter` gained a seven-case component test covering the footer's whole
contract, including that deleting is gated behind the confirmation and that dismissing it does not
delete. Honest caveat on Decision D: the test was written against the old implementation's contract
but never got a green run against it, because the targeted build failed on `pzl-spfx-components`
resolving through a stale `pp365-projectwebparts/lib`. It therefore characterises the new dialog. The
assertions are role- and text-based, so they would have held for either implementation.

**Two things found during slice 2 that are deliberately not fixed in it.**

*File type icons never render outside ProjectExtensions.* `initializeFileTypeIcons()` is called in
exactly two places, both inside ProjectExtensions' document template dialog
(`SelectScreen/columns.tsx`, `TargetFolderScreen/columns.tsx`). Nothing in shared-library,
ProjectWebParts or PortfolioWebParts calls it, and each solution bundles its own copy of the icon
set, so registering it in one does not help the others. `FileNameColumn` therefore calls
`getFileTypeIconProps` against an unregistered set, and the file-name icon in Dynamisk liste's
document library view does not render. Confirmed pre-existing, not caused by this phase: reproduced
on an earlier build on the main channel, where the icons are equally absent. `FileNameColumn` itself
was already on `@fluentui/react-file-type-icons` before slice 2 and was not touched by it. The fix is
one `initializeFileTypeIcons()` call where the `ItemColumn` renderers register; it belongs with the
renderer work in slice 6, or as its own small commit, not in a hygiene pass that is meant to change
nothing.

*The shared confirm dialog has no reachable caller.* Its only two consumers are the
`ColumnFormPanelFooter`s in PortfolioOverview and PortfolioAggregation, and both sit behind
`EDIT_COLUMN` / `ADD_COLUMN` menu items that are hard-coded `disabled: true` in
`useColumnContextMenu.ts`. The panel cannot be opened in the product, so the conversion is covered by
its component test and nothing else. Open question for slice 7: if that menu item is not coming back,
the dialog, both footers and the column form panel are all deletable, which is worth more than slice
2's 148 KB; if it is coming back, the dialog is now ready for it.

### Slice 3 — easy components (2026-09-23, in progress)

Re-inventoried first, because the plan's counts predate slices 1 and 2. 148 files still imported v8
at the start of this slice, not the 214 in the inventory table, and the split across solutions had
moved. Two of the plan's expectations for this slice were already wrong:

- **PortfolioExtensions was already free of v8** — zero imports — while still declaring
  `@fluentui/react` in its `package.json`. Nothing to convert, just a dependency to drop.
- **ProjectExtensions will not be freed by this slice.** Beyond the easy components it still uses
  `DetailsList`, `Panel`, `Dialog`, `Breadcrumb` and `ProgressIndicator`, which belong to slices 4,
  6 and 7.

Classified by whether a file's *whole* v8 import set is inside this slice's scope: **42 files convert
fully** (their v8 import disappears) and **21 partially** (other v8 symbols stay for later slices).

**MessageBar, done.** `MessageBarType` is gone from the repository: 13 files converted, plus the two
error models that carry the severity. The v8 numeric enum became the v9 `MessageBarProps['intent']`
string union — `error` → `'error'` (9 sites), `warning` → `'warning'` (3), and `severeWarning` →
`'error'` (1), since v9 has no severe-warning intent and error is what v8 rendered closest to.

This fixed a live defect rather than only moving an import. `UserMessage` in the shared library has
been fully v9 for some time and takes `intent`, but `ProjectSetupError` still carried a v8
`MessageBarType`, and `projectSetup/index.ts` passed it straight through as
`intent: props.error['messageType']`. A number reaching a v9 `intent` does not match the string union,
so the bar fell back to default styling: **project setup errors and warnings were rendering as neutral
informational messages instead of red or amber.** `ErrorWithIntent` in the shared library was already
the correct v9-native shape; the other models have now been brought onto it. `CustomError.test.ts`
pins the severity as a string for exactly this reason.

**Two solutions dropped `@fluentui/react` entirely:** ProgramWebParts (its last v8 file was a single
`MessageBarType` in `programAggregation/types.ts`) and PortfolioExtensions (already free). Four
solutions still declare it: shared-library 42 files, PortfolioWebParts 42, ProjectWebParts 33,
ProjectExtensions 19.

**A gap in how "free of v8" was being measured, found by the build.** Dropping `@fluentui/react`
from ProgramWebParts broke its Sass compile: two `.module.scss` files carried
`@import 'pkg:@fluentui/react/dist/sass/References.scss'`. Being free of v8 means free in the
stylesheets too, not only in TypeScript, and the earlier inventory only counted `.ts`/`.tsx`.

Surveying all 28 stylesheets that carried that import, only **two actually use anything from it**:
`ProjectExtensions/.../ProgressDialog.module.scss` (`$ms-color-*` variables) and
`ProjectWebParts/.../SummarySection.module.scss` (the `ms-Grid` mixins). The other **26 import it and
use nothing**. Removing those is provably neutral: `_References.scss` says so in its own header —
"Variables and mixins that can be referenced without outputting any CSS" — and it imports only
`variables/*` and `mixins/*`, never the CSS-emitting partials such as `_Font.scss`, `_Grid.scss` or
`_Responsive.scss`. All 26 removed, with a guard in the script that refuses to strip an import from
any file that references an `ms-` mixin or `$ms-` variable. Only those two stylesheets now depend on
Fluent v8 Sass, and they are the last thing keeping `@fluentui/react` in ProjectExtensions and
ProjectWebParts once their TypeScript is converted.


**Sass: ProgressDialog converted, SummarySection deferred as agreed.**
`ProgressDialog.module.scss` moved off the four v8 `$ms-color-*` variables onto v9 CSS custom
properties, which the surrounding `FluentProvider` (in `@BaseDialog`) already emits. Worth knowing
what those variables actually were: not hex, but SharePoint theme tokens
(`"[theme:neutralSecondary, default: #605e5c]"`) substituted at runtime by SPFx, so the dialog used
to follow the *site* theme for its neutrals while every v9 surface around it used the Fluent theme.
The mapping is documented in a comment at the top of the file; tokens were chosen for the closest
value inside the right family (`Foreground3` #616161 for #605e5c rather than the semantically tidier
`Foreground2` #424242, which would have visibly darkened the text). One pre-existing hardcoded
`#605e5c` in the same file was tokenised with them. `SummarySection.module.scss` and its `ms-Grid`
mixins are deliberately left for slice 7, where the status page is being worked on anyway: that one
is a float-based 12-column grid and replacing it is a layout rewrite with visual risk, not a rename.
It is now the **only** thing in the repository that needs Fluent v8 Sass.

**Icon is not one job, it is three.** The plan lists `Icon`/`IIconProps` as 11 easy files; it is 16,
and only a minority are a simple swap:

1. *Name-based* — `<Icon iconName='X' />`. Two sites, both converted to `getFluentIconWithFallback`,
   which resolves catalog names and legacy MDL2 aliases alike.
2. *File-type icons* — five sites spread `getFileTypeIconProps(...)` or `TemplateItem.getIconProps()`
   into a v8 `Icon`. **These cannot move to v9 at all.** `@fluentui/react-file-type-icons` is a
   v8-family package whose whole output is props for the v8 `Icon`, and Fluent v9 has no file-type
   icon equivalent. This is the same root cause as the unregistered-icons defect noted above, and it
   means `@fluentui/react` cannot leave shared-library or ProjectExtensions while file-type icons are
   rendered the way they are today.
3. *`IIconProps` carried in data models* — `BenefitMeasurement.TrendIconProps`,
   `ProjectTemplate.iconProps`, `TemplateItem.getIconProps()`, and the props threaded into
   `CopyProgressScreen` and `ProgressDialog`. Converting these means changing the model's shape from
   a v8 props bag to a name plus options, then updating each renderer. That is a real refactor, not a
   find-and-replace, and it should travel with the `ItemColumn` work in slice 6 rather than sit in an
   "easy components" slice.

So the phase's definition of done needs a decision it does not currently contain: what happens to
file-type icons. The options are to keep `@fluentui/react` in the two solutions that render them, to
replace them with a mapping onto the Fluent v9 catalog (losing the distinct Office file-type
glyphs), or to render the file-type icons as images from the CDN the package already points at.

**Shimmer, done.** The v8 `Shimmer` is gone from the repository. Five render sites moved to v9
`Skeleton`/`SkeletonItem` keeping their exact dimensions (the 140x36 tab placeholders in
`ProjectList`, the full-width row placeholders in `useProjectListRenderer`, the 274px card placeholder
in `ProjectCard`) and two wrapper sites in ProjectStatus became a conditional `LoadingSkeleton`.
`IShimmerProps` is gone too: it was only ever used as `Pick<IShimmerProps, 'isDataLoaded'>` in three
interfaces, which now declare the boolean themselves.

`LoadingSkeleton` gained an optional `rows` prop, defaulting to the three rows it has always
rendered so no existing call site changes. `Commands` asks for one row, because a three-row, 32px
padded placeholder standing in for a single toolbar moves the page far more than the real content
does. Two cases added to its test.

Two files keep the v8 `Shimmer` deliberately: `ListSection` and `UncertaintySection` wrap a
`ShimmeredDetailsList`, and converting the outer shimmer while the inner list keeps its own would give
one component two different loading placeholders. They convert with the list, in slice 6.

**Form controls: mostly simple, with one cluster that is not.** 28 files touch them. Most are direct
swaps (`Spinner`, `Toggle` → `Switch`, `DefaultButton`/`PrimaryButton` → `Button`, `Link`, `Label`) or
type-only (`ITextFieldProps`, `IDropdownOption`). The exception is
`shared-library/src/components/ItemColumn/ColumnDataTypeField`, which is a sub-system rather than a
control: a v8 `Dropdown` (already carrying a `TODO: Use new Combobox from Fluent UI 9`), an
`ISelectableOption`-based option model with icon props, an `IRenderFunction` custom option renderer,
and a `ColumnDataTypePropertyField(type, props)` factory that five `ItemColumn` renderers feed v8
`TextField`/`Toggle` into. Its own type already defaults to the v9 `InputProps | SwitchProps`, so the
abstraction was half-migrated and the call sites were left behind. Converting it means moving the
option model and the render function to v9 and translating the props at all five call sites, since
v9 `Input` has no `label`, `multiline` or `description`. It is best treated as its own piece of work
alongside the `ItemColumn` renderers in slice 6 rather than as an "easy component".

**Form controls, the simple ones done.** `Toggle`, `Spinner`, `Link`, `Label`, `Slider`,
`DefaultButton`/`PrimaryButton` and `TextField` converted where they were not entangled with a v8
container. Three of the conversions were not one-for-one and are worth knowing about:

- `ProjectPropertyEdit`'s v8 `Toggle` had an `onText`/`offText` pair; the v9 `Switch` has a single
  label, so the value is now held in the component and the label follows it. Same behaviour, more
  code.
- `DocumentTemplateItem`'s `TextField` became `Field` + `Input`: v9's `Input` has no `label`,
  `suffix` or `errorMessage`, so the label and validation moved to `Field` and the character counter
  to `contentAfter`, and the change handler now reads `data.value` instead of a second argument.
  **The seven tests written against the v8 implementation in slice 1 passed unchanged**, which is
  Decision D doing exactly what it is for.
- `ColorConfigurator`'s v8 `Slider` reported `(value)`; the v9 one reports `(event, data)`.

Deliberately left with their v8 containers, to avoid touching the same file in two slices:
`CreateParentDialog`, `RunProjectSetupDialog`, `EditCopyScreen` and `TargetFolderScreen/index.tsx`
put their buttons inside a v8 `Dialog`/`DialogFooter` (slice 4), and `ColorConfigElement`'s `Slider`
sits inside a v8 `Callout` (slice 4) and uses `valueFormat`, which v9 has no equivalent for.

**Still to do in this slice:** `Icon` and `IIconProps` (11 files) onto `getFluentIcon`, `Shimmer` (7)
onto `Skeleton`/`LoadingSkeleton`, and the form controls (`TextField`, `Toggle`, `Slider`, `Checkbox`,
`Dropdown`, `DefaultButton`/`PrimaryButton`, `Link`, `Label`, `Spinner`). One constraint the plan does
not mention: `shared-library/src/icons/index.tsx` uses the v8 `Icon` deliberately, as the
`getFabricIcon` fallback that renders legacy MDL2 icon names. It cannot move to `getFluentIcon`
without removing the fallback mechanism itself, so it stays on v8 until that fallback is retired.

### Slice 6 and 7 feedback round (2026-09-29)

Five findings from the user's manual pass over slice 6, and one bonus bug older than the migration.

- **"Visningsmodus" listed underneath the drawer.** The data type dropdown was the v8 `Dropdown`
  kept as a hold-out; its callout rendered in the v8 layer, below the v9 `OverlayDrawer`. Its sibling
  "Synlighet for kolonne" is a v9 `Combobox` and works — the production evidence recorded under
  Decision B. Converted to the v9 `Dropdown` to match; the open-and-pick test case is gone with a
  comment saying why, the other five stay.
- **Trend icons too small, and arrows instead of chevrons.** `ITrendIcon` now names `ChevronUp` and
  `ChevronDown`; the two cells draw them at 20px, the size the v8 font icon had in its 20px
  container. The two `ArrowTrending` catalog entries added in batch 1 are removed again.
- **Target folder: row should select, name should enter.** A behaviour change, asked for: the grid
  is single-select, selecting a row picks it as the copy target without entering it, the name link
  and row double-click enter it, and entering clears the selection. "Kopier hit" copies to the
  selected folder, else the current one, else the library root. One test case added.
- **24px above the dialog buttons.** A `.folders` wrapper with bottom padding.
- **Status sections: values greyer and smaller than headers, like the portfolio lists.** Applied in
  `DataGridList` itself — cells at 12px in `--colorNeutralForeground2`, headers at 12px — which is
  what the v8 list gave every list. It reaches the project list view, the timeline list and the
  measurements dialog too, which were 14px on their own before; consistent with the hub now.
- **Bonus: clicking "Kolonneinnstillinger" closed the menu instead of opening its submenu.** The
  submenu trigger inherited the `onClick` that closes the whole menu. It no longer does, and it is
  marked `hasSubmenu`. A regression test was written and then removed: opening a v9 `Menu` popover
  hangs the Jest worker the way the combobox family does, so this one is verified by hand.

Test counts unchanged at 254 after a one-in, one-out; `rush rebuild` green.

### Slice 8 — close-out (2026-09-29, in progress)

Scoped by the four decisions of 2026-09-29 (Decision A ratified; timeline fit; sticky tabs to CSS;
`PropertyFieldColorConfiguration` deleted). The inventory below was measured before any of it was
touched, so the close-out has numbers to close against.

**Timeline list, why it always scrolled.** Read from Fluent's `columnResizeUtils`: the grid measures
its *parent* and its auto-fit does shrink columns — from the last one backwards, down to each
`minWidth` — so with every timeline column at `minWidth: 100` and one column per view field, a view
with more columns than the web part has hundreds of pixels can never fit, whatever Fluent or the
user does. Two changes: `DataGridList` gains `fitColumnsToContainer`, which measures the container
itself and hands the grid ideal widths that already share it in proportion to the preferred widths
(`fitColumnWidths`, a pure function with its own tests), as the v8 justified layout did; and the
timeline columns' floor drops from 100 to 80, so eleven columns fit a web part where eight did. The
second is one number in `fetchTimelineData` and the user can push it back.
The status report's list and uncertainty sections take the same fit, since their v8 list was
justified too; see the third feedback round for why they were not on the shared grid.

**The status page's sticky tabs, and the pane that scrolled them.** The v8 `ScrollablePane` in
`ProjectStatus` scrolled the report inside its own box, and `SectionTabs` used the v8 `Sticky` to pin
the tabs to that box's top; choosing a tab found the pane by its v8 class name and scrolled it by
arithmetic. The page now scrolls the report as it does every other web part — the web part's
container had no height or overflow the pane relied on — the tabs are `position: sticky; top: 0`
(the suite bar sits outside the page's scroll region, so no offset), a tab calls the section's own
`scrollIntoView`, and the sections carry a `scroll-margin-top` that keeps them clear of the pinned
tabs. Test first: the tabs render per section, then choosing one requests the scroll. The old
`.sticky` rule that hid the header and command bar in the pinned copy went with the pinned copy.

**`PropertyFieldColorConfiguration` is deleted.** Zero references anywhere; three loc keys it used
(`ColorPickerStrings`, `RevertDefaultColorConfigurationText`, `SaveColorConfigurationText`) remain in
the triad unused, which `validate-loc` does not mind. Git keeps the component.

**The shared library's last four type-only v8 imports are our own types.** `ITag` was the term
search's return shape and the idea fields' input — `ITagItem` now, the same data-model story as
`IMenuItem`, `IPersonaItem`, `IListColumn` and `ITrendIcon`; `ProjectTemplate.iconProps` is a plain
`{ iconName }`, all any reader took from it; `UserSelectableObject` no longer *implements* the v8
`IObjectWithKey`, since its `key` is what made it selectable and the v8 hub only needs the property;
and `DayOfWeek` is a numeric enum the compat date picker declares but does not export, so Monday is named locally as the number the prop takes. shared-library is down to **six** v8 files, and every one is a named hold-out: `Autocomplete`
(three files, its own slot), `FileNameColumn` and the icon fallback (Decision G), and the people
picker (Decision B).

**Coverage floors are set.** Each solution's `config/jest.config.json` now carries a
`coverageThreshold.global` at the close-out's measured totals rounded down — statements / branches /
functions / lines: shared-library 28/59/27/28, PortfolioWebParts 12/16/12/12, ProjectWebParts
12/19/7/12, ProjectExtensions 19/48/18/19, ProgramWebParts 29/32/7/29, PortfolioExtensions 0/2/2/0.
Every `heft test` enforces them, so coverage can only rise from here; raising a floor is a
one-line change when it does.

**ProjectWebParts drops `@fluentui/react`.** With the sticky tabs converted and the colour
configurator gone it has no v8 import left, so per Decision C the dependency leaves its
`package.json` through `rush update`, as ProgramWebParts' and PortfolioExtensions' did in slice 3.
Three solutions keep it, each for a documented reason: shared-library (B, G, `Autocomplete`),
PortfolioWebParts (the hub, A as ratified), ProjectExtensions (G).

**A category the sweep never counted: v8 Sass.** Dropping `@fluentui/react` from ProjectWebParts
failed its build at once — not in TypeScript but in Sass: `SummarySection.module.scss` imported
`@fluentui/react/dist/sass/References.scss` for the Fabric grid mixins, the item the slice 2 log had
deferred and every later `grep` over `.ts`/`.tsx` was blind to. It was the only one in the repository
(checked across all six solutions' stylesheets). The float grid is now the same layout in flex, with
the same widths, 8px gutters and 1366px breakpoint, and the class names unchanged; the section gets a
render test, since jsdom cannot see layout and a v8 baseline for a pure stylesheet change would have
proved nothing. Lesson for the definition of done: sweep `.scss` for `@fluentui/react` and `ms-`
mixins as well as the TypeScript imports.

**Verified.** `rush rebuild` with `NODE_OPTIONS=--max-old-space-size=8192`: all eleven operations
succeed, **264 tests pass** (shared-library 203, ProjectExtensions 22, ProjectWebParts 21,
PortfolioWebParts 14, ProgramWebParts 3, PortfolioExtensions 1), zero lint errors, and every
coverage floor holds. v8 imports per solution: shared-library 6, PortfolioWebParts 15,
ProjectExtensions 6, the other three 0; `@fluentui/react` is a dependency of shared-library,
PortfolioWebParts and ProjectExtensions only. The `.scss` sweep finds no v8 import or Fabric mixin
(the one match is the comment in `SummarySection.module.scss` that says what it replaced). The
status web part's bundle now carries the grid's typography rules, checked by `grep` for their
hashed class — the check that found the third-round cause.

**Lint, the starting line.** Four rules are relaxed to `warn` in `.eslint-config/index.js` for the
migration: `@typescript-eslint/no-floating-promises` (70 warnings), `@typescript-eslint/no-use-before-define`
(0), `require-atomic-updates` (10) and `prettier/prettier` (68). The rest of the tree's warnings are
house rules that were always `warn`: `no-console` 62, `no-unused-vars` 59, `no-useless-catch` 24,
`no-lone-blocks` 23, `require-await` 21, `no-void` 17, `no-empty` 14, `no-new-null` 13,
`no-unused-expressions` 10, `pair-react-dom-render-unmount` 9, `eqeqeq` 5. **415 in all**:
shared-library 111, ProjectWebParts 124, PortfolioWebParts 59, ProjectExtensions 59,
PortfolioExtensions 40, ProgramWebParts 22. `allowWarningsInSuccessfulBuild` is not set anywhere.
Prettier and unused-vars are mechanical; the floating promises are the ones that need reading.

**Coverage, the starting line.** No thresholds exist. Totals (statements): shared-library 28.3 %,
ProgramWebParts 29.9 %, ProjectExtensions 19.9 %, PortfolioWebParts 12.6 %, ProjectWebParts 11.6 %,
PortfolioExtensions 0.3 %. Each solution's `config/jest.config.json` only `extends` the shared
config, so per-solution thresholds go there, at these floors rounded down, and may only rise.

**Dependencies, the verdicts the plan asked for.** `@reduxjs/toolkit` is `~1.9.5` in five
solutions; 2.x changes `createSlice`/`createAction` typing and drops the `AnyAction` export this
tree imports in its reducers — a real migration, not part of this phase. `xlsx` is `^0.16.9` in one;
0.18 is a rewrite with a changed `utils` surface — same verdict. The React-15-era peers are
`react-beautiful-dnd ~13.1.1` and `react-calendar-timeline 0.28.0`, both pinned to peer ranges that
include 17; neither needs to move for this phase.

**Close-out, decided 2026-09-30.** With slice 8 tested and committed, the phase closes in this
order on this branch, each step its own commit, then the branch merges into `main` and the next
phase starts on a new branch with its own plan (`docs/plans/fluent-v9-phase-4.md`). The release
that carries phases 3 and 4 is **1.15**, and it is not cut before phase 4 is done.

1. **The three lists onto the shared grid.** The program administration's project list and the two
   project setup sections still render `DataGrid` directly and miss the typography, the containment
   and the fit; `DataGridList` gains the checkbox labels they set on their selection cells, and the
   program list keeps its grouping by rendering one grid per hub. A render test each.
2. **Version stamping for channel builds.** Every channel build ships the packages as `1.14.0.0`, so
   SharePoint clients keep cached manifests and serve stale bundles — the tenant ran ProjectExtensions
   at `be4d347` next to a ProjectWebParts bundle from before slice 8. `modifySolutionFiles.js`
   already rewrites `package-solution.json` per channel; it will also set the fourth version segment
   from the CI run number when the workflow provides it, so every deployment is a new version. The
   release build keeps its own stamping.
3. **Lint close-out.** The four relaxed rules go back to `error` and what they flag is fixed: 70
   floating promises read one by one, 38 Prettier, 10 atomic updates, 3 use-before-define. The 264
   house-rule warnings (no-console 62, unused-vars 59, useless-catch 24, lone-blocks 23,
   require-await 21, no-void 17, no-empty 14, no-new-null 13, unused-expressions 10,
   pair-react-dom-render-unmount 9, eqeqeq 5, import-requires-chunk-name 4, no-unsafe-regexp 2,
   jsx-key 1) stay warnings and are recorded per rule as the allow-list the definition of done
   permits; phase 4 revisits them.
4. **Definition-of-done sweep and the release note.** The sweep is recorded here, the release note
   for 1.15 is drafted as unreleased: a technical change with no intended functional difference, plus
   the visible ones made on purpose (sticky section tabs, the timeline and status lists fitting their
   container, the column form panel for site admins, the target folder's row selection and unselection).
5. **Merge gate.** `rush rebuild` green, the test-channel CI green *including the four browser smoke
   tests added on 2026-09-30* (timeline fit at two widths, dialog fit at two widths, folder unchoose),
   which pass only when the tenant serves the new bundles — so the gate also proves step 2.

The coverage pass (slice 3b), the hub conversion (Decision A, after the coverage pass) and the
hold-outs are phase 4.

**Close-out, done 2026-09-30.** Steps 1 to 4 landed the same day, verified by one full
`rush rebuild` (all eleven operations, **277 tests**, zero lint errors, every floor held).

1. *The three lists.* The program administration's project list and the two project setup sections
   render `DataGridList`; their column hooks return `IDataGridColumn` with the widths that were
   separate sizing options, and their selection handlers take ids. `DataGridList` labels its
   selection cells for screen readers (`DataGridSelectAllLabel`, `DataGridSelectRowLabel` in the
   shared strings) — only on selectable grids, since Fluent renders the cell whenever the slot is
   given, which the project list's tests caught as an empty first cell on lists without selection.
   Render tests for all three (four cases for the program list, three each for the sections).
2. *Version stamping.* `modifySolutionFiles.js` stamps `PP365_BUILD_NUMBER` into the fourth segment
   of the solution's and its features' versions; both channel build jobs pass `github.run_number`.
   Dry-run on a copy: `1.14.0.0` becomes `1.14.0.1234` and the revert restores it. Documented in
   `.tasks/README.md`.
3. *Lint.* The four rules are `error` again. `no-floating-promises` flagged 70 sites: 67 are
   deliberate fire-and-forget calls — effects that start a fetch, toolbar clicks that run an async
   command, `context.model.set` in the field elements, `ListLogger.log` in catch blocks — and are
   marked `void` (with `no-void` allowing it as a statement); 3 in `PortalDataService` were real
   misses, an `update` and an `add` after an `await` that the caller could observe half done, and
   are awaited. `require-atomic-updates` keeps `allowProperties` (the setup tasks write step
   results into a shared params object by design) and three variable reassignments after awaits
   are restructured (`ensurePlan`, the status report's attachments, the admin permission check).
   `no-use-before-define` ignores hoisted functions and classes used inside methods, and the one
   variable case declares the selection with its callback; the archive view's configuration
   function moved above its effect. Prettier ran over every solution's sources.
   **Allow-list**, the 248 house-rule warnings left, by rule: no-console 62, no-unused-vars 59,
   no-useless-catch 24, no-lone-blocks 23, require-await 21, no-empty 14, no-new-null 13,
   no-unused-expressions 10, pair-react-dom-render-unmount 9, eqeqeq 5, import-requires-chunk-name 4,
   no-unsafe-regexp 2, react/jsx-key 1, no-void 1 (an expression, not a statement). Phase 4 pays
   them in the files its slices touch; `allowWarningsInSuccessfulBuild` stays unset.
4. *Definition of done, swept.* `grep -rl "from '@fluentui/react'"`: shared-library 6 (the people
   picker, the file type icon column and fallback, `Autocomplete` ×3), PortfolioWebParts 15 (the
   hub and the two web parts' v8 types), ProjectExtensions 6 (the file type icon sites) — every one
   a named hold-out; `@fluentui/react` is a dependency of those three solutions only. No
   `@uifabric/*`, `pzl-spfx-components`, `fabric.min.css`, compat aliases or v8 Sass remain. The
   relaxed rules are `error` and the warnings left are the documented allow-list above. Coverage
   floors are enforced per solution. **Open, carried into phase 4:** a test for every web part root
   and interactive component (no root has one yet), and the browser suite's program site (present,
   skipped without `E2E_PROGRAM_URL`), navigation flows and two write flows. The release note for
   1.15 has its Fluent UI v9 paragraph with the four intended visible differences.

### Feedback round on the close-out (2026-09-30)

Three findings from the user's test of the close-out batch, each fixed with a unit test and, for
the two the user asked to see verified, an end-to-end flow that was run against the tenant with the
*local* bundle before deployment.

- **A new overview column sorted first after a reload, and its sort order did nothing.** A
  portfolio view keeps its own column order (`GtPortfolioColumnOrder`) once a user has arranged
  the columns, and `configure()` sorted by it alone: a column added later was not in it, `indexOf`
  said -1, and the column came first; the column's own sort order is bypassed by design while a view
  has an order, which is why "changing the sort order does nothing". The aggregation's data sources
  have no such order, so it never showed there. Fixes: `addColumnToPortfolioView` appends the new
  column to the view's order and returns its id (the form used to dispatch a column without one, so
  it could not be edited or deleted before a reload), the reducer appends it to the view in the
  state, and `configure()` puts a column the order does not know after the ordered ones, by its sort
  order. Both add-column calls now throw on failure instead of returning `false`, so the form shows
  the error instead of closing as if saved. Model test for the three orderings.
- **A report's snapshot opened in the same tab.** `window.open(url, '_self')`; now `_blank`.
- **Program administration: a removed project haunted the selection, a collapsed hub group lost
  its visible selection, and small groups needed a click.** The grid's selection was Fluent's own,
  uncontrolled, so it outlived the rows it named and the groups' unmounting; the state was right
  all along. The list is controlled now: each hub group's grid shows its share of the selection and
  reports the whole selection back, groups with fewer than ten projects start open, and every group
  opens while a search is active (the add dialog groups its hundreds of projects per hub, all
  collapsed, so a search hit was hidden). Reducer and list tests.

- **Project setup dialog: order.** The user's one finding on the folded sections. Templates list
  in title order (they came in list order); extensions and list content keep their groups — the
  template's mandatory items, then the selected ones, then the rest — with each group in title
  order, which the groups lacked. Hook tests for all three.

**Two write flows, `e2e/tests/flows/`.** The user asked for both to be verified end to end:
`portfolio-overview-column.spec.ts` adds a column as a site admin, reloads and expects it last,
and removes it through the REST API (leftovers first); `program-administration.spec.ts` selects
and unselects, removes the first child project and adds it back through the dialog, and re-adds it
in the clean-up if the flow fails half-way. They pin the defects on the deployed build and pass
with the local bundles. These are the two write flows phase 4's slice 1 asked for, so that slice
starts here. Two lessons for the browser suite: a spec must not import helpers from another spec,
since Playwright registers the imported file's tests too (the helpers live in `tests/fixtures/`
now), and a local dev build must carry the *channel's* component ids or the tenant's page never
asks it for a bundle — the timeline site happened to be on the main channel, the program and hub
pages are on the test channel (`modifySolutionFiles.js --force` with `SERVE_CHANNEL=test`, as
`npm run watch` does).

**Two things the run surfaced.** The program's child project the flow removed was not put back
on its first runs (the add dialog's groups were collapsed) and was restored from the program item's
version history through REST; the flow's clean-up now handles the groups. And Jest reported the
shared library's branches floor missed (58.65 % against 59) while the Heft build still succeeded:
the floors are *reported*, not enforced, so `Build-Release.ps1` now fails on a missed floor, and
that one floor is at its measured 58.

Verified by a full `rush rebuild`: all eleven operations, **286 tests**, zero lint errors, no floor
missed; the two local-bundle flows green against the tenant.

**The CI run of that commit** deployed cleanly (the stamped version took) and its browser job showed
the overview column last after the reload on the deployed build, which is the fix verified where it
matters. The flow still failed on its own clean-up check: the overview shows the columns it
persisted in local storage as placeholders until its data arrives, and the check read those, with
the deleted column still in them. The header helper now waits for the results counter to show a
count, and the flows drop the persisted set before a reload. The dialog smoke test was flaky once
on a 30 s navigation timeout to the library and passes on retry; its navigation now allows 90 s.

### Second feedback round on slices 6 and 7 (2026-09-29)

- **Target folder: no double-click.** A row selects the folder as the copy target, its name enters
  it, and nothing happens on double-click. `SelectScreen` still enters a folder on double-click as
  the v8 list did; the user has not asked for that to change.
- **Trend icons: filled carets, centred.** `CaretUp` and `CaretDown` join the catalog (the chevrons
  from the first round were the wrong glyph), drawn filled at 20px, and both cells centre the icon
  against the text with a 6px gap.
- **Status section typography, second attempt.** The first attempt put 12px and
  `--colorNeutralForeground2` on the cell as a single class. Two things were wrong with it, found by
  reading Fluent's styles rather than guessing: Fluent sets the header's *regular* weight on the
  button it renders inside the header cell, not on the cell, and the row's colour on the row; and
  `Foreground2` (#424242) is barely lighter than the headers' `Foreground1`, where the v8 values were
  `neutralSecondary` (#605e5c). The rules are now scoped under the grid root so they outrank Fluent's
  single-class rules whatever the injection order, the header's semibold reaches the button, and the
  values use `--colorNeutralForeground3` (#616161), the v8 grey's nearest token. Headers 12px
  semibold, values 12px grey, as the v8 list drew every list.
- **Timeline list: a horizontal scrollbar whatever the column widths.** Pre-existing, as the user
  said, and diagnosed rather than fixed: the container is already `overflow: auto`, so the grid is
  genuinely wider than it — each column's starting width is its `maxWidth` (150–250px) and there is
  one per view field, while Fluent's auto-fit only ever grows the last column to fill spare room and
  never shrinks anything. The v8 justified layout shrank columns to fit. The candidate fix is to start
  columns at `minWidth` (100px, so eight columns fit a web part) and let users widen them, or to size
  them to the container on first render. Either changes the look for every timeline user, so it
  waits for the user's word.
- **Status section typography, third round — the rules never reached the report.** The second
  attempt's rules were right and the user still saw 14px regular in `Foreground1`, with a pasted row
  whose cells carried no module class. The cause was not the stylesheet: `ListSection` and
  `UncertaintySection` still rendered Fluent's `DataGrid` directly, as slice 6 batch 2 had left
  them, and slice 7's fold onto `DataGridList` had passed them by — the status web part's bundle did
  not contain the grid's stylesheet at all (`grep` for its hashed class over every ProjectWebParts
  bundle: present in the timeline and dynamic list bundles, absent from the status one). Both
  sections now render `DataGridList`, and since their v8 `ShimmeredDetailsList` was justified they
  fit their columns to the section as the timeline does. Three lists still render `DataGrid`
  directly — the program administration's project list and the two project setup sections — but
  those were on v9 before this phase, with checkbox labels and grouping the shared grid has no props
  for; they never had a v8 look to match, so they are noted here, not changed.
- **Status sections: row lines past the section's edge.** Reported on the same test. Fluent's
  column sizing sets `min-width: fit-content` on the grid root whenever columns are resizable, so a
  grid whose columns do not fit grows past its parent — every row line with it — instead of
  shrinking; the sections had nothing around the grid to stop it. The v8 list scrolled
  horizontally inside its own content wrapper (`constrainMode` horizontal, its default), so the
  shared grid now always renders inside a container with `overflow-x: auto`, for every list on it,
  and measures that container only when asked to fit (the width hook takes an `enabled` flag, so
  the other lists do not re-render on resize). Together with the fit, a section's list shares the
  section's width and scrolls only when the columns' floors exceed it, as in v8.
- **The timeline's scrollbar "no matter what", and the template dialog's (2026-09-30, measured
  with Playwright on the tenant).** Fluent's `DataGrid` subtracts its selection cell's width (44px,
  `CELL_WIDTH` in `react-table`) from the container it auto-fits to whenever a `selectionMode` is
  set — unless `containerWidthOffset` is passed, and `DataGridList` passed `0`, copied from the
  program administration list. The data columns then filled the whole container and the checkbox
  cell pushed every row 44px past it, whatever the columns did. Measured on the deployed build:
  the timeline grid 1578px in a 1534px container at 1920px wide; the template dialog's target
  folder screen 844px in an 800px content area (the name column stretched to 800, plus the cell),
  on a library with subfolders — the select screen happened to fit at that width. `DataGridList`
  no longer passes the offset, its own fit shares `container − 44` when there is a selection, and
  the program administration list loses the same override.
- **The fit's second blind spot: Fluent's per-column padding.** Verified with the local bundle
  loaded onto the tenant page through SPFx's debug manifests (Playwright with the dev certificate
  and Chromium's local-network check relaxed): the grid then matched its container exactly, 894px
  at a 1280px viewport and 1534px at 1920px, but the columns were not the even shares the fit
  computes — the last ones were squeezed to their floor. Fluent's column state carries a `padding`
  of 16 per column that its auto-fit counts (`getTotalWidth` sums `width + padding`) while its cells
  render it outside the width they are given, so shares that summed to the container were one
  padding per column too wide and the auto-fit took the difference from the end. `fitColumnWidths`
  now sets that padding aside first; measured again, every column is 106px at 1280 and 186px at
  1920, the last one two pixels wider with the rounding remainder, and the grid still fills its
  container to the pixel.
- **Deployment note from the same measurements.** The tenant served ProjectExtensions at
  `be4d347` (the footer says so) but a ProjectWebParts timeline bundle from before slice 8 — the
  columns still had the old 100px floor and the grid no wrapper — although CI had deployed both
  from the same commit. Every package keeps version `1.14.0.0` across channel builds, which is the
  cached-manifest trap already noted for releases; a tester who does not see a change should clear
  the site's client-side data before doubting the build.
- **Where the measurements live now.** Two smoke tests pin both defects against the deployed
  build: `e2e/tests/smoke/timeline-list.spec.ts` (grid no wider than its container, columns
  sharing its whole width, at 1280 and 1920) and `document-template-dialog.spec.ts` (both screens
  of the dialog, at 1280 and 1600, read only). Their local-bundle variants under `e2e/tests/local/`
  run only with `E2E_LOCAL_BUNDLE=1` and a dev server; the timeline one is what verified the fix.
  The dialog's local variant is written but has not passed: with the debug manifests the deployed
  custom action's command did not render, with or without a `customActions` parameter, so the
  dialog is covered by its smoke test and by the shared grid's fix that the timeline proved.
- **Target folder: a chosen folder could not be unchosen (2026-09-30).** Fluent's single
  selection is a radio: its row handler re-selects a selected row on a second click, and runs
  before any handler of ours. `DataGridList` now clears a controlled single selection when its
  selected row is clicked, or toggled with Space, again — reported after Fluent's re-select, so the
  clear wins — which takes the target folder screen back to "copy here" for the current folder.
  Grid and screen tests cover it, and the dialog's smoke test has a third case that pinned the
  defect on the deployed build (the row stayed `aria-selected` after the second click).

### The slice 7 CI failure (2026-09-29)

The slice 7 commit failed CI in both workflows with `1 Jest test failed` in `pp365-shared-library`,
after passing `rush rebuild` locally twice. The test's name is not recoverable: `Build-Release.ps1`
prints the last 200 lines of the rebuild log on failure, and those are Rush's summary, which omits
the middle of a long failing log ("...308 lines omitted...") — exactly where Jest names the test and
prints its assertion. The per-project `rush-logs` file that has the block stays on the runner and is
not uploaded. Neither workflow's job log contains it.

Ruled out locally, all 199 green: `CI=true` with `TZ=UTC` and a C locale; two Jest workers as in
CI; three further consecutive runs. Ruled out by inspection: a tracked throwaway probe test (none
tracked), case-sensitive paths (the Linux build resolved every import, and no shared-library test
uses `jest.mock`), tests reading the environment, version or clock (none). No Docker on the machine
for a true Linux run.

`Build-Release.ps1` now prints the Jest failure blocks from every project's own
`rush-logs/*.build.log` when the rebuild fails. The next run named the test:
`DialogColumn › opens a dialog with the title and the measurements`, Jest's five-second whole-test
limit, thrown while still inside the click that opens the dialog. What passes on the same runner
narrows it: the dialog with an empty list, and `DataGridList`'s own eight tests. It is the grid
rendered *inside the modal dialog* that exceeds five seconds there and takes milliseconds locally —
runner-only behaviour inside Fluent's focus and sizing machinery under jsdom, the same class as the
combobox family, one layer down. The browser is unaffected: "Vis alle målinger" was verified by hand
in the slice 6 review.

The first fix stubbed the grid inside the dialog with a plain table over the dialog's *real* column
definitions, so every assertion about headers and cells still exercises `useColumns` and the grid
stays covered by its own suite. That removed the grid's cost but was not the whole story: the same
test then failed **locally**, only inside a full parallel `rush rebuild`, with the one-second
`findBy` wait elapsing before the dialog appeared. The test is **load-sensitive**, not
runner-specific — in isolation the dialog opens in milliseconds; with every suite running at once
the worker is starved of CPU and wall-clock waits elapse. CI's two starved vCPUs tripped the
five-second test limit inside the click; a loaded Mac trips the one-second wait after it. Both
dialog-opening cases now wait up to ten seconds for the dialog and allow twenty for the test, sized
for that load; a dialog that never opens still fails, later. Lesson for the harness: a wall-clock
wait in a suite that renders a Fluent surface must be sized for the full parallel run, not for the
suite alone, and a green focused run proves nothing about it.

**A third face of the same test (2026-09-29, slice 8 verification).** The full rebuild failed it
once more, differently: the ten seconds elapsed with the dialog *in the DOM*, open, its rows
rendered — and `aria-hidden="true"` on the surface, which Testing Library's role query rightly
skips. Fluent puts that attribute on a surface only when a closed dialog is kept mounted, and this
one unmounts on close (the default). Tabster puts it there: its modalizer marks every dialog surface
that is not the *active* one hidden, on a 250 ms timer keyed to where focus is
(`Modalizer._hiddenUpdate`, `hiddenElements` are all inactive modalizers whatever else is active),
so an open dialog that focus has not entered, or has left, is hidden until focus returns. Under
load that state outlasted the query; the identical rebuild minutes earlier had passed. The test now
finds the dialog with `hidden: true` — honest, since a surface that is found is an open one — and
asserts on its content as before. Lesson: a role query for a Fluent dialog encodes Tabster's focus
state, not the component's; assert on what the component renders.

### Slice 7 — lists, part 2 (2026-09-29, complete except for the hub decision)

**Opened, as Decision I said, with the shared v9 grid built from the two sites already in
production.** Before building it: an interaction-level probe, because slice 6 had only ever
*rendered* a `DataGrid` and the combobox family had shown that rendering proves nothing about
clicking. Sorting by header click and multiselect by checkbox both work in the harness; the probe's
one failure was its own `aria-label` on the selection cell, not the grid, and it was deleted once the
wrapper's own test covered the same ground.

`DataGridList` in the shared library takes `IDataGridColumn` — a column definition plus the widths
to size it by, the shape the project list, the timeline list and the measurements dialog had each
declared locally — and gives sorting, resizable columns, single or multi selection reported as row
ids, row double-click as the v8 "invoke", and an empty state. `createDataGridColumns` now emits that
shape, so the `IListColumn`-fed lists take the same road. Eight interaction tests on the wrapper, six
on the adapter.

**Four sites folded, each with its tests unchanged from the baseline written first:** the project
list view (5), the timeline list (5), the measurements dialog (4 + 4) and `SelectScreen` (4). The
three local column types collapsed into the shared one. `SelectScreen` was the one with behaviour to
rewrite: the v8 `Selection` class was constructed in the dialog root, passed to the screen, and read
back in the reducer with `getSelection()`. The reducer now carries the selected templates directly,
the screen reads and dispatches through the dialog context, and the object is gone from all three
files. Two behaviours were kept deliberately: opening another folder starts the selection over, as
the v8 list did when its key changed, and double-clicking a folder row opens it. One was dropped:
marquee (drag) selection, which v9 does not have.

Three harness lessons, recorded so they are not re-learned: `@microsoft/sp-lodash-subset` is already
mapped to a real lodash, so no mock is needed; every `@pnp/*` export is a truthy proxy, so a renderer
that decides "has a value" with `stringIsNullOrEmpty` from `@pnp/core` renders every cell empty under
test — the timeline's renderer now uses a local check, which is also the right dependency for a pure
renderer; and a `jest.mock` factory that *replaces* the `@pnp/core` stub takes `Caching` and friends
with it and breaks module loading, so an override must wrap the stub, not replace it.

**Decision A, per list — recommendation, for the user to ratify: the hub stays on v8 for this phase.**
What is left on v8 is exactly the hub in `PortfolioWebParts/src/components/List`, the two portfolio
web parts that use it (and `IdeaModule` through them), and the four files where their reducers hold
the hub's `Selection` object as state. Measured against `useList.ts`, `ListHeader.tsx` and
`types.ts`, the hub gives three things `DataGridList` does not: **grouping** (both portfolio views
group rows), a **sticky header** (`ScrollablePane` + `Sticky`) that carries the web part title, the
search box, the toolbar and the filter panel while the list scrolls, and **marquee selection**.
Converting means emulating grouping with flattened group rows and expand/collapse state, rebuilding
the sticky header with CSS `position: sticky` in a scroll container the web part does not own,
rewriting selection as row ids in two reducers, and dropping marquee — the largest single piece of the
migration, on a component with zero tests, under a release note that promises no functional
difference. Decision A's rule was written for this case. The cost is recorded here so that whoever
picks it up starts from the list above, not from the plan's one-line row.

**Slice 7 closed.** `rush rebuild` exit 0, **254 tests** (228 → 254), zero errors. Files importing
v8: ProjectExtensions **11 → 7** (all seven are Decision G's file-type icons and their `IIconProps`),
the rest unchanged; no solution drops `@fluentui/react` in this phase, and the plan's definition of
done already makes room for that (Decisions A, B, G). Remaining outside the hub and its reducers:
`Sticky`/`ScrollablePane` in the status page layout (a CSS-sticky job, small, untested),
`PropertyFieldColorConfiguration` (the user's call), the data type dropdown and the people picker
(combobox family), `Autocomplete`, and four type-only imports in the shared library. All slice 8.

### Slice 6 — lists, part 1 (2026-09-28, complete)

Started from `docs/plans/fluent-v9-migration/HANDOFF-slice-6.md`, whose measurements this log does
not repeat.

**The `IColumn` swap was the leverage point, and it was a type change only.** `IListColumn` in
`shared-library/src/types` declares the fifteen members the repository actually reads and writes,
measured before it was written (`fieldName` 107 reads, `data` 43, `key` 33, `name` 19, then a long
tail). It is a structural subset of the v8 `IColumn` with the same names and types, so it passes
straight into the v8 list hub without a cast and a v8 column reads as one of ours. `IProjectColumn`
and `IProjectContentColumn` extend it instead of `IColumn`; 28 files were swept in one scripted pass;
all three consumers type-checked clean against the rebuilt library on the first try. Only the four
hub files in `PortfolioWebParts/src/components/List` still import `IColumn`, which is Decision A.

**The `ItemColumn` form controls were a descriptor problem, not a rendering one.** The renderers never
rendered `Toggle` or `TextField`; they handed the *component reference* and v8 props to a
`ColumnDataTypePropertyField(type, props)` descriptor that `DataTypeFields` `createElement`ed. So the
v8 coupling was the descriptor contract, and the descriptor type already defaulted to v9 props while
every caller still passed v8 — a half-finished migration. The fix is a discriminated descriptor
(`switch` | `checkbox` | `text` | `number`) with small factories, so a renderer knows no Fluent at all
and `DataTypeFields` is the one place a kind becomes a control. All thirteen descriptor callers were
inside the shared library, so the contract could change freely. Tests first: eleven cases against v8,
green; the same eleven against v9 found one real difference — v8 `TextField` with `value: undefined`
was uncontrolled so typing accumulated, while a v9 `Input` fed `''` is controlled from the first
keystroke. The fix keeps the typed text in local state seeded from the stored value, which also
avoids the uncontrolled-to-controlled switch React warns about.

**`TrendIconProps` was a fourth v8 type used as a payload**, built in PortfolioWebParts'
`BenefitMeasurement` as `IIconProps` and serialised through the adapter to `TrendColumn`. It is now
`ITrendIcon` — a catalog icon name and a colour — and `ArrowTrending`/`ArrowTrendingDown` join the
catalog for `StockUp`/`StockDown`. Derived at load time, never persisted, so nothing stored changes.

**The v9 `Dropdown` is the same hold-out as `TagPicker`**; see the amendment under Decision B. Two
probes, one with our code and one with Fluent's bare documented `Dropdown`, both killed the worker on
open. Reverted the data type dropdown to v8 behind the new option type; its six-case test is green on
v8. The `promise/param-names` rule is another error-level lint that only surfaces in a full build — a
probe was rejected by it before it ran.

**One more v8 payload turned up in the closing sweep.** `DialogColumn`'s measurements grid rendered
`item.TrendIconProps` with a v8 `Icon`, and ProgramWebParts' adapter — which imports
`BenefitMeasurement` from `pp365-portfoliowebparts/lib/models`, a cross-solution dependency worth
knowing about — serialised the same key. Both now use `TrendIcon`. Lesson: when a payload key is
renamed, grep *every* solution for the old name, including the ones with zero v8 imports; a stale
key compiles fine through `any` and only shows as a missing icon.

**Batch 1 closed.** `rush rebuild` exit 0, **206 tests** (180 → 206; new: `DataTypeFields` 11,
`ColumnDataTypeField` 6, `TrendColumn` 5, `DialogColumn/useColumns` 4), zero lint or type errors.
Files importing v8: shared-library **32 → 12**, PortfolioWebParts **22 → 16**, ProjectWebParts
**17 → 7**, ProjectExtensions 12 (untouched), ProgramWebParts and PortfolioExtensions 0.
shared-library's twelve are all named hold-outs: the list hub's types (A), the people picker (B),
the file type and fallback icons (G), the data type dropdown (above), `Autocomplete` (its own slot),
and four type-only imports — `DayOfWeek`, `ITag`, `IObjectWithKey`, `IIconProps` in
`ProjectTemplate` — that are the same data-model pattern and belong to the next batch.

**Batch 2: the three no-selection lists are on `DataGrid`.** One shared adapter,
`createDataGridColumns` in `shared-library/src/util`, maps `IListColumn[]` onto `DataGrid`'s column
definitions and sizing options — `name` to the header, a column's own `onRender` to the cell,
`fieldName` to the text otherwise, `minWidth`/`maxWidth` to sizing, `isMultiline` to wrapping. It is
the one place a column meets the v9 grid, and all three conversions use it. The grid boilerplate is
repeated inline at the three sites on purpose: Decision I puts the shared v9 grid at the opening of
slice 7, built from the two production sites, and pre-empting it here would be the churn it warns
against.

Tests first, every time, and each conversion passed its own tests unchanged from the v8 baseline:
`TargetFolderScreen` 7 (folders listed and sorted, navigation into a folder, the empty message, both
buttons' dispatches, the library switch), `ListSection` 5, `UncertaintySection` 4 (matrix chosen from
the content type), the adapter 6. The shimmer wrappers those sections had were dead code — a section
renders its list only once it has items, which implies its data is loaded — so they became a
`LoadingSkeleton` on the one path that can still show. `TargetFolderScreen` keeps the v8 file-type
`Icon` in its columns under Decision G, and keeps row double-click as the v8 list's "invoke".

Three test-writing mistakes worth not repeating: a `mockReset()` inside the render helper wiped the
value each test had just primed (only the tests needing no value passed, which was the clue); a
section stand-in without `sumField` made `calculateValues` throw and sent the component down its
error branch, which the error test then happily confirmed; and four header strings rendered under one
parent become one text node, so `getByText` needs one element per header.

**Batch 2 closed.** `rush rebuild` exit 0, **228 tests** (206 → 228), zero errors. Files importing
v8: ProjectWebParts **7 → 5**, ProjectExtensions **12 → 11**; the rest unchanged. Only two v8 list
renders remain in the repository: the hub (Decision A) and `SelectScreen` (slice 7). What ProjectWebParts
has left is `Sticky`/`ScrollablePane` in the status page layout and `PropertyFieldColorConfiguration`
(slice 8); ProjectExtensions has the file-type icons (G) and `Selection` for `SelectScreen` (slice 7).

Slice 6 is complete against its plan row: `IColumn` is confined to the hub, the renderers and
form fields around the lists are v9, and every list that needs neither grouping nor selection is on
`DataGrid`. Slice 7 opens with the shared v9 grid and `SelectScreen`.

### Slice 4 — panels, menus and dialogs (2026-09-23, in progress)

44 files in scope: 17 PortfolioWebParts, 12 ProjectWebParts, 10 ProjectExtensions, 5 shared-library.
The prop surface is far smaller than that count suggests — across every panel in the repository only
`isOpen`, `headerText`, `onDismiss`, `onRenderBody`, `onRenderFooterContent`, `isLightDismiss` and
`type` are ever passed, and only two `PanelType` values are used at all (`medium` three times,
`smallFixedFar` once), mapping onto the v9 drawer's `medium` and `small`.

**`BasePanel` converted, and the call sites did not have to move.** It is the hub: `IBasePanelProps`
used to extend `IPanelProps`, and both `CustomEditPanel` and `AllPropertiesPanel` build on it. It now
renders a v9 `OverlayDrawer` behind the same v8 prop names, so consumers changed in only two places —
`CustomEditPanel` dropped a v8 `styles={{ main: { overflow } }}` (the drawer body is the scroll
container in v9, so the stylesheet owns it now) and `EditProjectStatusPanel` dropped
`onLightDismissClick`, which is redundant because v9's `onOpenChange` fires for the close button,
Escape and an outside click alike. `IBasePanelProps` is now self-contained rather than extending a
Fluent prop type, which is what let the surface stay stable across the switch.

**The v8 `Panel` was making the test suite pathologically slow.** `BasePanel.test.tsx` written
against the v8 implementation took **774 seconds** for five cases; the same five take **6.3 seconds**
on the v9 drawer. A 123x difference, from the v8 `Layer` portal under jsdom. Worth remembering as the
remaining panels convert, and worth checking if any other suite is mysteriously slow.

One thing the v8 baseline could not assert: `toBeVisible()` fails for content inside a v8 `Layer`
because jsdom cannot resolve a computed visibility through that portal, even though the content is in
the document. The tests assert presence instead, which is what actually matters for the conversion,
and they pass on both implementations.

**All nine panels are converted.** `FilterPanel` routes through `BasePanel` (dropping its own
duplicated `IdPrefixProvider`/`FluentProvider`, which `BasePanel` supplies), and the seven consumer
panels — the two `ColumnFormPanel`s, the two `ViewFormPanel`s, `EditViewColumnsPanel`,
`ProjectInformationPanel` and `NewRiskActionPanel` — now render `BasePanel` instead of a v8 `Panel`.
The v8 `Panel`, `PanelType` and `IPanelProps` are gone from the repository.

The compiler surfaced four things the call sites had been leaning on, each resolved rather than
papered over:

- `isFooterAtBottom={true}` at four sites. The v9 `DrawerFooter` sits at the bottom by construction,
  so the prop is gone rather than reimplemented.
- A v8 `styles={{ main: ... }}` override on one `ColumnFormPanel`, dropped like the one in
  `CustomEditPanel`.
- `onRenderHeader`, which `EditViewColumnsPanel` uses to put action buttons in the header instead of
  a title. Added to `BasePanel` as a proper prop and rendered in place of `headerText`.
- `title` and `hidden`, which were being inherited silently from `IPanelProps`. They are now declared
  where they are actually used — `title` on `IEditViewColumnsPanelProps`, `hidden` on
  `IBasePanelProps`.

**A trap the tests could not catch: the drawer opens on the wrong side by default.** The v8 `Panel`
always slid in from the right; the v9 `OverlayDrawer` defaults to `position='start'`, the left. The
conversion therefore moved both converted panels to the left-hand side, which the tests had no way of
seeing — position is a visual concern, and Decision D forbids asserting on Fluent internals, so there
is no clean hook for it. Caught by looking at the tenant. `BasePanel` now defaults to `position='end'`,
matching the two drawers already in the product (the footer assistant and the template package
catalog), and exposes the prop for the rare case that wants otherwise. Check the side by eye on every
remaining panel this slice converts; only the `smallFixedFar` and `medium` panel types are in use and
both are right-hand, so `end` is correct everywhere.

**Slice 4's named families are done.** `Panel`, `PanelType`, `IPanelProps`, `ContextualMenu`,
`ContextualMenuItemType`, `IContextualMenuItem`, `Target`, `Dialog`, `DialogType`, `DialogFooter`,
`IDialogContentProps`, `ProgressIndicator`, `IProgressIndicatorProps`, `Breadcrumb` and
`IBreadcrumbItem` are all gone from the repository, along with the last v8 `MessageBar` (a deep
`@fluentui/react/lib/MessageBar` import the `MessageBarType` pass in slice 3 had missed — the web
part now uses the shared `UserMessage` it already used in the sibling branch).

**The same shape recurred three times: v8 types used as data models, not props.**
`IContextualMenuItem`, `IProgressIndicatorProps` and `IBreadcrumbItem` were each being passed between
hooks, reducers and data adapters rather than spread onto a component — in the menus' case the
rendering was already v9 and only the item model was v8. Each is now a small explicit type in the
shared library (`IMenuItem`, `IProgressProps`) or beside its component (`IFolderNavigationItem`),
declaring the handful of fields actually set. That removed more v8 coupling than converting the
rendering did, and it is worth looking for the same pattern in the list work.

Feature gaps handled rather than dropped: v8's `maxDisplayedItems` on `Breadcrumb` has no v9 prop, but
`partitionBreadcrumbItems` is Fluent's own helper for it, so the five-item limit survives. The v9
`ProgressBar` has no label or description, so those moved to a wrapping `Field`.

**Two `Callout` sites are deliberately left, because they are whole-component conversions:**
`shared-library`'s `Autocomplete` (its `Callout` is entangled with v8 `SearchBox`, `List`,
`FocusZone`) and `ColorConfigElement` (entangled with v8 `ColorPicker` and a `Slider` using
`valueFormat`, inside the unreferenced `PropertyFieldColorConfiguration`). Picking off the `Callout`
alone would leave both components substantially v8 while risking their positioning and focus
behaviour.

**Stock-take after slice 4.** 88 files still import v8, and they group cleanly: **lists** 77 imports
(slice 6/7, by far the bulk), **icons** 15 (Decision G's file-type hold-out plus the `IIconProps` data
models), **people picker** 10 (slice 5), and **37 uncategorised** — which is the useful part of this
count, because the plan never assigned them. Those 37 are: the `ColumnDataTypeField` cluster deferred
from slice 3 (~14), `Autocomplete` (7), the unreferenced `PropertyFieldColorConfiguration` (6), four
list-adjacent leftovers (`LayerHost`, `ScrollbarVisibility`, `IScrollablePaneProps`,
`IShimmeredDetailsListProps`), the two `ShimmeredDetailsList` wrappers deferred from slice 3, and a
lone `DayOfWeek` in the `DatePicker` call site. `Autocomplete` in particular is a composite component
no slice owns; it should be given one before slice 6 starts.

**Slice 4 closed with the prop modernisation of Decision H.** `BasePanel` now takes `open`,
`onClose`, and `header` / `footer` / `children` as content rather than the v8 render props. Two
things are worth recording about the fan-out:

I enumerated nine call sites; the compiler found **eleven more**. The rename ripples through every
props type that *extends* `IBasePanelProps` — `ICustomEditPanelProps`, `IEditViewColumnsPanelProps`,
`NewRiskActionPanel` — so `EditPropertiesPanel`, `EditProjectStatusPanel`, `DynamicList`,
`ProjectTimeline`, `ProjectCard` and `ProjectList` all had to change without ever naming `BasePanel`.
Doing this as one isolated pass, after every panel had been converted, was the right call.

Four state interfaces did `Pick<IBasePanelProps, 'isOpen'>`. Renaming those would have pushed `open`
into reducer state and action payloads, so they declare `isOpen` themselves instead: it is component
state, not a panel prop, and `open={state.viewForm.isOpen}` is clearer for being explicit.

**A gap in the fast feedback loop, found the hard way.** Replacing the last v8 `MessageBar` with
`UserMessage` removed the only JSX from `portfolioAggregation/index.tsx`, leaving its default `React`
import unused — and `unused-imports/no-unused-imports` is one of the few rules configured as an
*error*, so it failed the build rather than joining the warning pile. The per-solution
`npx tsc --noEmit` used throughout these slices as a quick check does not run ESLint, so error-level
lint rules only surface in a full `heft build`. Run one before declaring a slice done.

**The rename escaped the compiler in five places, and e2e caught one of them.** The CI run for
`126306ce` failed on `benefit overview page loads`: the "Filtrer" button did nothing. The claim above
that "the compiler found eleven more" was true but incomplete — it only holds for call sites that
pass props *as JSX attributes*, which is where excess-property checking applies.

Five sites instead build a props **object** typed as the panel's props interface and hand it to a
component that spreads it (`<FilterPanel {...props.filterPanel} />` in `Toolbar`,
`<EditViewColumnsPanel {...props} />`). A spread is not excess-property-checked, and because `open`
is optional, a leftover `isOpen` was neither an error nor a missing required prop. The panels
compiled, deployed, and silently never opened:

| Site | Surface |
|---|---|
| `PortfolioOverview/hooks/usePortfolioOverview.ts` | Porteføljeoversikt — filter panel |
| `PortfolioOverview/hooks/useEditViewColumnsPanel.ts` | Porteføljeoversikt — Vis kolonner |
| `PortfolioAggregation/usePortfolioAggregation.ts` | Porteføljeaggregering / Nytteoversikt — filter panel |
| `PortfolioAggregation/useEditViewColumnsPanel.ts` | Porteføljeaggregering — Vis kolonner |
| `DynamicList/useToolbarItems.tsx` | Dynamisk liste — filter panel |

One of the five used `as IEditViewColumnsPanelProps`, which suppresses the check outright.

The fix renames all five. The guard against a recurrence is to declare the old names as `never` on
`IBasePanelProps` rather than deleting them:

```ts
/** @deprecated Use `open`. */
isOpen?: never
/** @deprecated Use `onClose`. */
onDismiss?: never
```

A `never` mismatch is a *type* error (`TS2322: Type 'boolean' is not assignable to type 'never'`),
not an excess property, so it is reported through spreads and through `as` assertions alike. Verified
by reintroducing the bug: silent before the guard, an error after it.

**Lesson for the remaining slices.** When renaming a prop, the compiler only covers JSX call sites.
Grep for props objects typed as the interface (`useMemo<IXProps>`, `: IXProps =`, `as IXProps`)
before trusting a green build — the more a codebase builds props in hooks, the less a rename is
mechanical.

The e2e suite covered one of the five surfaces. `portfolio overview renders its list` now opens its
filter panel too; the other three are still uncovered and belong to slice 3b.
