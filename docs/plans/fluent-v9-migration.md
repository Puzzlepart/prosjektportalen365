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
| 2 | Hygiene | Replace `pzl-spfx-components` (1 file), `@uifabric/file-type-icons` (1 file) and `pzl-react-reusable-components` (`useConfirmationDialog` → a v9 `Dialog` in the shared library, 2 files; drop the dead dependency in ProgramWebParts); delete the two webpack aliases; remove `fabric.min.css` from the five web parts after replacing the `ms-Grid` mixins in `SummarySection.module.scss` with flex/grid CSS | two aliases, `fabric.min.css`, `@uifabric/*`, a duplicate Fluent v8+v9+React copy |
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

**Still to do in this slice:** `Icon` and `IIconProps` (11 files) onto `getFluentIcon`, `Shimmer` (7)
onto `Skeleton`/`LoadingSkeleton`, and the form controls (`TextField`, `Toggle`, `Slider`, `Checkbox`,
`Dropdown`, `DefaultButton`/`PrimaryButton`, `Link`, `Label`, `Spinner`). One constraint the plan does
not mention: `shared-library/src/icons/index.tsx` uses the v8 `Icon` deliberately, as the
`getFabricIcon` fallback that renders legacy MDL2 icon names. It cannot move to `getFluentIcon`
without removing the fallback mechanism itself, so it stays on v8 until that fallback is retired.
