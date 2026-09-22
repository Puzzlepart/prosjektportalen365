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

Related hygiene: `pzl-spfx-components` (1 file in ProjectWebParts; the only reason for the `office-ui-fabric-react` alias in `spfx-customize-webpack.js`), `@fluentui/react/dist/css/fabric.min.css` (5 web parts; only `ms-Grid` mixins in `SummarySection.module.scss` still depend on Fabric core), `@uifabric/file-type-icons` (1 file; `@fluentui/react-file-type-icons` is already a dependency), four packages with React 15/16-era peers (`react-autocomplete`, `react-image-fade-in`, `react-scroll`, `react-calendar-timeline` via `create-react-context`), Redux Toolkit 1.9 (2.x available), `xlsx` 0.16 (0.18.5 is the last npm release), `react-markdown` 8 (10 is ESM-only; fine under webpack, stubbed under Jest).

Versions: `@fluentui/react-components` ~9.72.10 → 9.74.8, `@fluentui/react-icons` ~2.0.317 → 2.0.341, `@fluentui/react-datepicker-compat` → 0.6.38. `@fluentui/react` stays pinned at 8.106.4 until Decision A and B are closed, then it is removed.

Lint debt: 414 warnings (ProjectWebParts 111, shared-library 85, ProgramWebParts 85, ProjectExtensions 55, PortfolioExtensions 40, PortfolioWebParts 38). Top rules: `no-floating-promises` 79, `no-console` 74, `no-unused-vars` 72, `no-useless-catch` 29, `require-await` 26, `no-lone-blocks` 24, `no-new-null` 20, `no-empty` 17, `no-void` 14, `require-atomic-updates` 10. Three rules were relaxed to `warn` in Phase 1 pending this clean-up: `no-floating-promises`, `no-use-before-define`, `require-atomic-updates`.

## Decisions

### A. Lists: one shared `List` on v8 for now, converted last, behind its own interface (decided)

44 files touch `DetailsList`; almost all of them do so through two hubs, `PortfolioWebParts/src/components/List` (`ShimmeredDetailsList` with grouping, sticky header, selection, column resize and context menus) and the `ItemColumn` renderers in the shared library. v9's `DataGrid` has sorting, selection and resizable columns but no grouping, no sticky header and no built-in virtualization, and Microsoft's list replacement is still `@fluentui/react-list-preview`. Rewriting the portfolio list on `DataGrid` today would lose grouping or force a home-made one.

Rule: convert everything around the lists first (toolbars, panels, column pickers, renderers) so that `DetailsList` is reached only through `PortfolioWebParts/src/components/List` and the equivalent in the shared library, with `IColumn` confined to those modules behind our own `ProjectColumn`/`ProjectContentColumn` types. The last slice then decides per list: `DataGrid` where the list needs none of grouping, sticky header or virtualization (most `DynamicList` views, admin lists), and the v8 `DetailsList` kept inside the one shared wrapper where it does, until v9 has parity. `@fluentui/react` remains a dependency of the shared library only, in that case.

### B. People picker: one shared wrapper, v8 inside (decided)

Seven files use `NormalPeoplePicker`. v9 has no people picker; the options are the PnP `PeoplePicker` (also v8 inside), a `TagPicker`-based component with our own Graph/people search, or keeping v8. Rule: create one `PeoplePicker` component in the shared library with a v9-shaped API (`selected`, `onChange`, `multi`, resolver), implemented on the v8 `NormalPeoplePicker` for now, and route all seven call sites through it. Replacing the inside later is a one-file change.

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
| 2 | Hygiene | Replace `pzl-spfx-components` (1 file), `@uifabric/file-type-icons` (1 file); delete the two webpack aliases; remove `fabric.min.css` from the five web parts after replacing the `ms-Grid` mixins in `SummarySection.module.scss` with flex/grid CSS | two aliases, `fabric.min.css`, `@uifabric/*` |
| 3 | Easy components | `Icon`, `MessageBar`, `Shimmer`, form controls (57 files across all solutions), tests first per Decision D | most v8 imports in ProjectExtensions, PortfolioExtensions, ProgramWebParts; those three solutions drop `@fluentui/react` |
| 3b | Coverage pass | Tests for every web part root and interactive component not touched by slices 3 to 7 (already on v9), hook and adapter tests, first coverage thresholds; `E2E_PROGRAM_URL` and the `flows` folder in the browser suite | untested components |
| 4 | Panels and menus | `Panel` → `OverlayDrawer` (18), `ContextualMenu`/`Callout` → `Menu`/`Popover` (10), `Dialog`/`Breadcrumb`/`ProgressIndicator` (6) | v8 overlay components |
| 5 | People picker | Shared wrapper per Decision B, seven call sites | scattered `NormalPeoplePicker` |
| 6 | Lists, part 1 | Confine `DetailsList`/`IColumn` to the two hubs; convert renderers and toolbars around them; `DataGrid` for lists that need no grouping/sticky | `IColumn` outside the hubs |
| 7 | Lists, part 2 | Decide per remaining list (`DataGrid` vs wrapped v8); `@fluentui/react` removed from every solution that is free | v8 in the web part solutions |
| 8 | Lint close-out | Relaxed rules back to `error`, `allowWarningsInSuccessfulBuild` revisited, `Redux Toolkit` 2 / `xlsx` 0.18 / React-15-era peers evaluated with a one-line verdict each | tolerated warnings |

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

`grep -rl "from '@fluentui/react'" SharePointFramework/*/src` lists only the shared list and people picker wrappers (or nothing); `@fluentui/react` is a dependency of the shared library only (or of none); no `@uifabric/*`, `pzl-spfx-components`, `fabric.min.css` or compat aliases remain; the three relaxed lint rules are `error` and `rush rebuild` reports zero warnings, or a documented, short allow-list; every web part root and interactive component has a test file meeting the Decision D targets, coverage thresholds are enforced in `pp365-jest-config` at or above the slice 3 baseline, the browser suite includes a program site, the navigation flows and two write flows; the release notes for the version carrying this phase describe it as a technical change with no intended functional difference.
