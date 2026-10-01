# Phase 5: the dependency upgrades before 1.15

Planned 2026-10-01, after phase 3 merged (#1777) and the user decided that 1.15 ships only when
everything is upgraded: the three items the phase 3 plan had set aside as separate migrations are
part of 1.15. Runs after phase 4 (`docs/plans/fluent-v9-phase-4.md`), on its own branch off
`releases/1.15`. **The user says when 1.15 is done.**

## Goal and non-goals

Goal: Redux Toolkit on 2.x, xlsx on 0.18, and React 18 where the platform allows it, each with
no intended functional difference, verified by the test regime phase 4 leaves behind; then the
1.15.0 release. Non-goals: new features; a React 18 upgrade ahead of SPFx's support for it, which
is not ours to decide (see P5-1).

## Inventory (2026-10-01)

| Dependency | Now | Target | Where |
|---|---|---|---|
| `@reduxjs/toolkit` | `~1.9.5` in five solutions | 2.x | 25 files: 12 reducers on `createReducer` with the `AnyAction` type the 2.x line drops, 10 files with `createAction`, no `createSlice` |
| `xlsx` | `^0.16.9` in one solution | 0.18 | 1 file, six calls: `utils.aoa_to_sheet`, `book_append_sheet`, `book_new`, `json_to_sheet`, `sheet_to_json`, `write` |
| `react` / `react-dom` | `17.0.1` in all six, pinned by SPFx | 18 | Every component. SPFx 1.23.2 declares `react >=16.13.1 <18.0.0` in `sp-core-library`'s peer range and ships 17.0.1 in `sp-webpart-base` and `sp-property-pane`, so the platform does not allow 18 today |
| `react-beautiful-dnd` | `~13.1.1` | a maintained fork, or none | 3 files (the edit-view-columns panel). Unmaintained upstream; its React 18 story is the fork's |
| `react-calendar-timeline` | `0.28.0` | the current line | 3 files (the timelines). React 18 compatibility to verify |

## Decisions

- **P5-1. React 18 follows SPFx, not the other way round.** The upgrade is made in the SPFx release
  that first allows React 18 in its peer ranges, and not before: a React above the platform's range
  is unsupported by Microsoft and a risk in every web part host. Until then, slice 3 makes the code
  ready (the two React-15-era peers replaced or confirmed), so the upgrade is a version bump when
  it comes. If no such SPFx exists when the rest of 1.15 is done, the user decides whether 1.15
  waits.
- **P5-2. Order: xlsx first, Redux Toolkit second, React last.** Smallest and most isolated first;
  each is its own slice, commit series and test-channel run.
- **P5-3. Behaviour is pinned before each upgrade** (Decision D continues): the export, the
  reducers and the drag-and-drop panel get tests on the current versions first, so the upgrade's
  only job is to keep them green.

## Slices and order

| # | Slice | Scope | Exit |
|---|---|---|---|
| 0 | Branch and baselines | New branch off `releases/1.15`; record the inventory above, the test counts and the six package sizes | Baselines in this document |
| 1 | xlsx 0.18 | A test for the Excel export on 0.16 (a sheet from rows, a workbook written to a blob); then the bump and whatever the changed `utils` surface needs; the download checked by hand on the test tenant | Export test green on 0.18 |
| 2 | Redux Toolkit 2 | Reducer tests where none exist (the program administration's is the model); then the bump: `AnyAction` replaced by `UnknownAction` or the reducer's own action union, `createReducer`'s object form moved to the builder callback where 2.x requires it, `rush update`; every web part with a reducer checked by hand | All reducers tested, green on 2.x |
| 3 | React 18 readiness | `react-beautiful-dnd` replaced by a maintained fork with the same API or by the panel's own ordering, `react-calendar-timeline` on a line that declares React 18, every `ReactDOM.render` call (the nine `pair-react-dom-render-unmount` sites) made ready for `createRoot`; nothing bumps yet | The two peers settled, tests green on React 17 |
| 4 | React 18 | When an SPFx release allows it: the SPFx bump first (its own mini-phase on the toolchain plan's pattern), then React 18 with `createRoot`, StrictMode findings fixed, the Fluent and Tabster versions revisited; full manual round on the test tenant | 1.15's definition of done |
| 5 | Close-out and release | The release note for 1.15 finished (phases 3 to 5 as one technical change, the intended visible differences listed), the changelog complete, `Install/` and the upgrade path checked, the user's go | 1.15.0 cut |

## Rules for the executing agent

- Read `AGENTS.md`, the `pp365-toolchain` and `pp365-testing` skills, this plan and the phase 3
  and 4 plans before the first edit; dependency changes go in `package.json` plus `rush update`
  from the root, never through npm or pnpm in a solution.
- Never run git; the developer commits from your messages. End every batch with a semantic commit
  message.
- Tests before each bump (P5-3); a bump whose tests go red is reverted or fixed in the same slice,
  never left for the next.
- After each slice: `rush rebuild` green, push, wait for the test-channel run including the browser
  suite, then manual check of the affected surfaces on the test tenant.

## Risks

- SPFx may not allow React 18 within the time 1.15 can wait; P5-1 names who decides.
- `react-beautiful-dnd` has no upstream maintenance; a fork is a new dependency with its own
  lifetime, and the panel's own ordering may be the smaller risk.
- Redux Toolkit 2's typing changes surface as compile errors across 25 files; the reducer tests of
  slice 2 are what keep the fixes honest.
- Budget: three small slices and one that waits; keep agents focused and sequential.

## Definition of done

`@reduxjs/toolkit` 2.x and `xlsx` 0.18 in every solution that uses them, with tests on the export
and every reducer; the two React-15-era peers replaced or on a line that declares React 18; React
18 in place if an SPFx release allows it, or the decision not to wait recorded here with the
user's name on it; the release note for 1.15 complete; 1.15.0 cut when the user says so.
