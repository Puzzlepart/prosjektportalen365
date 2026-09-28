# Handoff: Fluent UI v9 migration, phase 3 slice 6 (lists)

Written for: the AI coding agent picking up slice 6 in a fresh session, and the developer working alongside it. Date: 2026-09-28. Branch: `feat/fluent-v9-migration`, working tree clean at `1e1820e4`.

Slices 0 to 5 are done, committed and verified on the test tenant. This document is what you need to start slice 6 without re-deriving the measurements or repeating the mistakes.

## Read first, in this order

| # | Document | Why |
|---|---|---|
| 1 | `docs/plans/fluent-v9-migration.md` | The plan. Decisions A to H, the slice table, and a per-slice log recording every finding and correction from slices 0 to 5. **Decision A governs slice 6.** |
| 2 | `AGENTS.md` (repo root) | Localization triad, generated files, Node 22, PnPjs 4 habits, component conventions. |
| 3 | `.claude/skills/pp365-toolchain/SKILL.md` | Rush translation rules and the verification checklist. |
| 4 | `.claude/skills/pp365-testing/SKILL.md` | The Jest harness, its gotchas, and the Playwright project. |
| 5 | This file | Slice 6 specifics. |

`docs/plans/spfx-1.23-heft-toolchain/HANDOFF.md` is the phase 1 handoff. You do not need it for slice 6, but it is the model this document follows.

## Rules for the executing agent

These are the user's standing constraints. They are not negotiable and they have held for every slice so far.

1. **Never run git commands.** The user does all git themselves. Use `rm` to delete files. Read-only `git log`/`git status` for diagnosis has been tolerated; nothing that writes.
2. **Never bypass Rush.** Dependency changes go in `package.json` plus `rush update` from the root. Never `npm install` or `pnpm` inside a solution.
3. **Tests before conversion** (Decision D). Write component tests against the *current* implementation, get them green, then convert. Tests must not assert on Fluent internals — class names, DOM structure. Roles, accessible names and text survive the switch; that is the whole point.
4. **End every batch of edits with a ready-to-use semantic commit message**: prefix, one-line subject, bullet body, ending with
   `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
   (replace with your own model line).
5. **Stop at the end of each slice.** Report what changed and what to test manually, then wait.
6. `jest.mock(...)` must precede imports. Never import `@pnp/*` in a test.

The user builds and deploys themselves by default, but has repeatedly asked for builds and e2e runs to be executed directly. Ask rather than assume.

## State at handoff

**Slice 6 is complete (2026-09-28).** `rush rebuild` is green: exit 0, **228 tests pass**, zero lint errors (warnings only, see slice 8). The `IColumn` swap, the `ItemColumn` form controls, the trend icon and the three no-selection lists are done; see the slice 6 log in the plan. This document stays as the record of what was measured; slice 7 starts from the plan's Decision I and the slice 6 log.

| Solution | Files importing v8 (at handoff → after batch 1) | `@fluentui/react` in `package.json` |
|---|---|---|
| shared-library | 32 → **12** | yes |
| PortfolioWebParts | 22 → **16** | yes |
| ProjectWebParts | 17 → **5** | yes |
| ProjectExtensions | 12 → **11** | yes |
| ProgramWebParts | **0** | no |
| PortfolioExtensions | **0** | no |

Test counts per solution: shared-library 188, ProjectExtensions 17, ProjectWebParts 10, PortfolioWebParts 9, ProgramWebParts 3, PortfolioExtensions 1.

## What was verified on 2026-09-28 — do not re-derive

Everything in this section was measured against the working tree at `1e1820e4`. The plan's own slice 6 row is a one-line sketch written before any of this was known; where they disagree, this section is right.

### Only five places render a v8 list

| Site | Component | Grouping | Selection | Shimmer | Decision A verdict |
|---|---|---|---|---|---|
| `PortfolioWebParts/src/components/List/List.tsx` | `ShimmeredDetailsList` | **yes** | multiple + marquee | yes | **Keep v8.** This is the hub Decision A protects. |
| `ProjectExtensions/.../DocumentTemplateDialog/SelectScreen` | `DetailsList` | no | multiple + marquee | no | `DataGrid` candidate |
| `ProjectExtensions/.../DocumentTemplateDialog/TargetFolderScreen` | `DetailsList` | no | **none** | no | `DataGrid` candidate, easiest |
| `ProjectWebParts/.../ProjectStatus/Sections/UncertaintySection` | `ShimmeredDetailsList` | no | **none** | yes | `DataGrid` candidate |
| `ProjectWebParts/.../ProjectStatus/Sections/ListSection` | `ShimmeredDetailsList` | no | **none** | yes | `DataGrid` candidate |

**None of the four non-hub lists uses grouping, and three use no selection at all.** That is the single most useful fact in this document: Decision A's hard case is one component, not five. The four others are plain tabular renders of a fixed column set, and `DataGrid` covers them without losing anything. Shimmer maps to `Skeleton`/`SkeletonItem`, already used elsewhere in the repo (`LoadingSkeleton`).

### The real reason `IColumn` is in 51 files

```ts
// shared-library/src/interfaces/IProjectColumn.ts
import { IColumn } from '@fluentui/react'

export interface IProjectColumn extends IColumn {
  id?: number
  internalName?: string
  sortOrder?: number
  dataType?: string
}
```

`ProjectColumn` and `ProjectContentColumn` are built on this, so **every** file that touches a column inherits the full v8 `IColumn` surface transitively. Of the 51 files mentioning `IColumn`, only 32 import from `@fluentui/react` directly; the rest get it through our own models.

This is the same pattern that dominated slices 4 and 5: a v8 *type* used as a data model rather than as component props. It was `IContextualMenuItem` (slice 4, replaced by `IMenuItem`), `IProgressIndicatorProps` (slice 4, `IProgressProps`), `IBreadcrumbItem` (slice 4), and `IPersonaProps` (slice 5, `IPersonaItem`). Expect the same shape here, at a larger scale.

The question slice 6 has to answer is **which members of `IColumn` the repository actually uses**. Measure this before designing the replacement — do not assume. The likely set is small (`key`, `name`, `fieldName`, `minWidth`, `maxWidth`, `isResizable`, `isSorted`, `isSortedDescending`, `isMultiline`, `onRender`, `data`, `iconName`, `columnActionsMode`), and once you know it, `IProjectColumn` can declare it outright and stop extending a Fluent type. That single edit is what frees the other 19 files.

Do this **before** touching any rendering. It is the slice's leverage point, and it is independent of the `DataGrid`-versus-v8 question.

### `Selection` is also a data model

`Selection` and `IObjectWithKey` from `@fluentui/react` are used as *state* in reducers and hooks, not as rendering:

- `PortfolioAggregation/reducer/actions.ts`, `usePortfolioAggregation.ts`
- `PortfolioOverview/reducer/actions.ts`, `hooks/usePortfolioOverview.ts`
- `ProjectExtensions/DocumentTemplateDialog/{index.tsx, reducer.ts, SelectScreen/types.tsx}`

`Selection` is a v8 *class* with behaviour (`getSelection()`, `setItems()`, change events), not just a type, so it is a harder swap than the type aliases were. It is wired into `MarqueeSelection` and `ShimmeredDetailsList` in the hub, which keeps v8 anyway. **Leave `Selection` alone in the hub.** The DocumentTemplateDialog uses it with a `DetailsList` you may convert — if you do, its selection state has to be rewritten to `DataGrid`'s own selection API. Budget for that; it is the largest single piece of behavioural work in the slice.

### The `ItemColumn` renderers still hold v8 form controls

There is **one** renderer tree, in `shared-library/src/components/ItemColumn/` (16 renderers plus
`registry.ts`, `types.ts`, `useOnRenderItemColumn.tsx`). `PortfolioWebParts/src/components/List/ItemColumn/`
is not a second copy: it holds five portfolio-specific renderers (`ConfigColumn`, `HubColumn`,
`ProjectInformationColumn`, `StatusReportColumn`, `TitleColumn`) that register themselves into the
shared `ColumnRenderComponentRegistry`. DynamicList renders its cells through the same registry via
`renderItemColumn`. An earlier draft of this document claimed the two overlapped; the six
"overlapping" directories were empty leftovers, deleted on 2026-09-28. See Decision I in the plan.

The shared-library tree still imports v8 **form controls**, not list components:

| File | v8 import |
|---|---|
| `DateColumn`, `UrlColumn` | `Toggle` |
| `CurrencyColumn`, `TagsColumn`, `UrlColumn`, `DialogColumn`, `BooleanColumn` | `TextField` |
| `TrendColumn`, `DialogColumn` | `Checkbox`, `Icon` |
| `ColumnDataTypeField` (+ `types.ts`, `useDataTypeDropdown.tsx`) | `Dropdown`, `IDropdownProps`, `ISelectableOption`, `IRenderFunction`, `Icon` |
| `FileNameColumn` | `Icon` — **keep, Decision G** |

These were in scope for slice 3 (form controls) and were deliberately deferred as "the `ColumnDataTypeField` cluster" because they are reached only through the lists. They are now slice 6's. They are ordinary v9 conversions — `Switch`, `Input`, `Checkbox`, `Dropdown`/`Combobox` — and are the low-risk way to start the slice while you are still measuring `IColumn`.

`FileNameColumn` keeps its v8 `Icon` under Decision G (coloured file-type icons; the user confirmed explicitly that these must stay). Do not convert it.

### What slice 6 does *not* cover

Slice 7 decides the fate of each remaining list and removes `@fluentui/react` from every solution that comes out free. Slice 6's job per the plan is to *confine* `DetailsList`/`IColumn` to the hubs and convert everything around them. Resist finishing slice 7 early: the user works slice by slice and tests between them.

`ListHeader` (`Sticky`, `StickyPositionType`, `IDetailsHeaderProps`, `IRenderFunction`) belongs to the hub and stays v8 for now.

## Traps this codebase has already sprung

Each of these cost real time in slices 3 to 5. They are all still live.

1. **The compiler does not see props objects.** Renaming a prop is only checked at JSX call sites. Five panels silently broke in slice 4 because their props were built as an *object* typed as the props interface and spread into the component (`<FilterPanel {...props.filterPanel} />`); a spread is not excess-property-checked, and an optional prop going missing is not an error. Before trusting a green build after a rename, grep for `useMemo<IXProps>`, `: IXProps =` and `as IXProps`. The guard now in `IBasePanelProps` — declaring old names as `?: never` — is the pattern to reuse, because a `never` mismatch *is* a type error and is reported through spreads and `as` alike.
2. **A v9 component shipping in `@fluentui/react-components` is not evidence it works here.** SPFx 1.23 pins **React 17**. `TagPicker` (slice 5) sends itself into an endless render loop on typing, killing the Jest worker, reproducibly in Fluent's own documented form with none of our code involved. Anything added to Fluent after the React 18 cutover needs an *interaction-level* test before adoption, not just a render. `DataGrid` is already proven: `ProjectList`'s list view and the timeline list run it in production on React 17 with sorting, column resize and multiselect (see Decision I). Reuse their hooks (`useList.ts`, `useTimelineList.ts`) as the model rather than starting from the Fluent docs. The v9 `Dropdown` is **not** usable: it loops on open exactly as `TagPicker` did, in Fluent's bare form (slice 6 log). Treat everything on `@fluentui/react-combobox` — `Dropdown`, `Combobox`, `TagPicker` — as a hold-out, and verify `ResponsibleField`'s production `Combobox` by hand.
3. **v8 stylesheet workarounds break v9 surfaces.** Five panels carried `.root { position: inherit }` from the v8 `Panel`, where the class landed on a wrapper inside a `Layer`. The v9 `OverlayDrawer` *is* a `<dialog>` positioned `fixed`, so the override dropped it out of the overlay layer — invisible in one web part, full-width inline in another. When you move a list into a v9 component, read its `.module.scss` for positioning and `ms-*` assumptions before assuming the class still means what it meant.
4. **`tsc --noEmit` does not run ESLint.** Three rules are configured as *errors* (notably `unused-imports/no-unused-imports`), so they only surface in a full `heft build`. Run one before declaring the slice done.
5. **Fluent popup surfaces compute to `pointer-events: none` under jsdom.** `userEvent.setup({ pointerEventsCheck: 0 })` is the accepted concession; see `UserFields.test.tsx`.
6. **Do not pipe a long `heft` run through `grep | head`.** It deadlocks at 0% CPU and looks like a hang. Redirect to a file and poll it.
7. **Two concurrent `heft`/`rush` runs on the same project fight over the build lock** and one gets killed (exit 144). Run one at a time.

## Testing expectations

Decision D's targets apply, and slice 6 is where list coverage finally matters. The e2e suite currently asserts only that a grid or table renders (`portfolio.spec.ts:47`, `program.spec.ts:29`) plus the filter panels. There is no coverage of sorting, grouping, column resize, selection or the item renderers — so **Jest component tests are your safety net, and they must exist before you convert anything.**

Useful precedents already in the repo:

- `shared-library/src/components/CustomEditPanel/CustomEditPanelBody/FieldElements/UserFields.test.tsx` — a component tested through a context provider with a mocked adapter, written against v8 and passing unchanged after the swap. This is the model.
- `shared-library/src/components/BasePanel/BasePanel.test.tsx` — presence rather than visibility, because jsdom cannot compute visibility through a portal.

Run one solution's tests with:

```
cd SharePointFramework/<Solution> && npx heft test --test-path-pattern <name> > /tmp/out.log 2>&1
```

Full verification before declaring the slice done:

```
cd <repo root> && NODE_OPTIONS=--max-old-space-size=8192 npm run rush:build
```

Expect exit 0 and at least 180 passing tests. `PortfolioWebParts` production builds need the 8 GB heap.

After changing `shared-library`, rebuild it (`rush rebuild -o pp365-shared-library`) before the consumers will see the change. After touching any `src/loc/*`, run `npm run validate-loc` in that solution — the triad (`myStrings.d.ts`, `nb-no.js`, `en-us.js`) must stay balanced or the build fails.

## Suggested order of work

This is a recommendation, not a decision — the plan's rule is what binds you.

1. **Measure which `IColumn` members are actually used** across all 51 files. Cheap, mechanical, and it sizes the rest of the slice.
2. **Convert the `ItemColumn` form controls** (`Toggle`, `TextField`, `Checkbox`, `Dropdown`) to v9, keeping `FileNameColumn` on v8. Tests first. Low risk, and it shrinks shared-library's v8 count immediately.
3. **Replace `IProjectColumn extends IColumn`** with an explicit interface carrying the measured member set. This is the change that frees the type out of 19 files. Expect fallout in sorting, grouping and the column form panels; the compiler will find most of it, but re-read trap 1 first.
4. **Convert the three no-selection lists** (`TargetFolderScreen`, `UncertaintySection`, `ListSection`) to `DataGrid`, one at a time, tests first, modelled on the two `DataGrid` sites already in production.
5. **Decide on `SelectScreen`** — it needs multi-selection, so converting it means rewriting its `Selection` state. This is a reasonable place to stop slice 6 and leave it for slice 7 if the slice is already large.

Leave `PortfolioWebParts/src/components/List` on v8 throughout. That is Decision A, and nothing measured on 2026-09-28 changes it.

## Decisions taken by the user on 2026-09-28

- **`SelectScreen` moves to slice 7.** Its multi-selection means rewriting its `Selection` state, and that is not slice 6's work. Slice 6 converts the three no-selection lists only.
- **Merge the two `ItemColumn` trees if possible.** Measured the same day: there is nothing to merge. The shared registry *is* the merge, PortfolioWebParts only registers five extras into it, and the apparent overlap was six empty directories, now removed. Decision resolved as done.
- **`PropertyFieldColorConfiguration` waits for slice 8**, as planned. The slice 8 line about the dormant column form panel is stale: it was enabled in `1e1820e4`.

A further question — whether the six list-bearing web parts should share more than they do today, and whether now is the time — is analysed as Decision I in `docs/plans/fluent-v9-migration.md`.
