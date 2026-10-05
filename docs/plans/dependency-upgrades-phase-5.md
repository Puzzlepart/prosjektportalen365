# Phase 5: the dependency upgrades before 1.15

Planned 2026-10-01, after phase 3 merged (#1777) and the user decided that 1.15 ships only when
everything is upgraded: the three items the phase 3 plan had set aside as separate migrations are
part of 1.15. Runs after phase 4 (`docs/plans/fluent-v9-phase-4.md`, merged as #1778), on branch
`feat/dependency-upgrades-phase-5` off `releases/1.15` at `bba23bc05`. **The user says when 1.15
is done**; the target is November 2026 (decided 2026-10-05).

## Goal and non-goals

Goal: Redux Toolkit on 2.x, xlsx on 0.18 or later, and React 18 on SPFx 1.24, each with no
intended functional difference, verified by the test regime phase 4 leaves behind; then the
1.15.0 release. Non-goals: new features; a React 18 upgrade ahead of SPFx's support for it, which
is not ours to decide (see P5-1); a new Node major, which comes after 1.15 (P5-5).

## Inventory (2026-10-01, recounted 2026-10-05)

| Dependency | Now | Target | Where |
|---|---|---|---|
| `@reduxjs/toolkit` | `~1.9.5` in five solutions | 2.x (2.13.0 on 2026-10-05) | 23 files. Nine reducers on `createReducer`, seven of them in the object notation 2.x removed (only the portfolio overview's and project information's use the builder callback); `AnyAction`, deprecated in 2.x for `UnknownAction`, in 11 files; `createAction` in 9; no `createSlice`. Five reducers have a test of their own (project status, the phase change dialog, the setup dialog, the portfolio overview, the program administration); the aggregation's, project information's, the phases' and the document template dialog's have none |
| `xlsx` | `^0.16.9` in shared-library | 0.18.5, or SheetJS's own 0.20.3 (P5-7) | 1 file (`ExcelExportService`), six calls: `utils.aoa_to_sheet`, `book_append_sheet`, `book_new`, `json_to_sheet`, `sheet_to_json`, `write`; four tests since phase 4 run the real library. npm's last release is 0.18.5 (2022): it fixes the three denial-of-service advisories against 0.16 (CVE-2021-32012 to 32014), not the two high ones, prototype pollution when a file is read (CVE-2023-30533, fixed in 0.19.3) and a ReDoS (CVE-2024-22363, fixed in 0.20.2), whose fixes SheetJS publishes only on `cdn.sheetjs.com` |
| `react` / `react-dom` | `17.0.1` in all six, pinned by SPFx | 18 | Every component; 15 files render with react-dom's `render`, 7 of them without the unmount `pair-react-dom-render-unmount` asks for. SPFx 1.23.2 declares `react >=16.13.1 <18.0.0` in `sp-core-library`'s peer range, 1.24.0-rc.0 `<19.0.0`. React is not in our bundles: every manifest asks SharePoint for `react` and `react-dom` as framework components by version (`"type": "component"`, `17.0.1`, no copy in the package), so the React a web part gets is the platform's to serve |
| `@types/react` / `@types/react-dom` | `17.0.45` / `17.0.17` in all six | 18 | The 18 types drop the implicit `children` from `FC`'s props; 20 files read `children` |
| SPFx (`@microsoft/sp-*`, the rig, the Heft plugins) | `1.23.2` in all six | 1.24 GA | 1.24.0-rc.0 is on npm (`next`), GA announced for October 2026. The rig against 1.23.2: Heft 1.2.17 to 1.3.2, the Jest plugin 2.0.6 to 2.0.19, the lint plugin 1.2.7 to 1.3.1, the Sass plugin 1.4.1 to 1.5.0; ESLint 9.37.0 and the rig's TypeScript 5.3.3 unchanged. Node: `>=22.14.0 <23.0.0 \|\| >=24.0.0 <25.0.0 \|\| >=26.0.0 <27.0.0` (1.23.2: 22 only) |
| `@pnp/spfx-controls-react` / `@pnp/spfx-property-controls` | `3.25.0` in four / `3.24.0` in three | a release for SPFx 1.24 if one comes in time (P5-6) | Both take `react` and `react-dom` 17.0.1 as dependencies, not peers, and no line declares React 18 (the controls' 4.0 beta of February 2025 says `<18`). 3.25.0 came eight weeks after SPFx 1.23.0 (2026-05-13 to 2026-07-06). Used for the term field (`ModernTaxonomyPicker`) and web part property panes, the project list's and the project card's among them |
| `@testing-library/react` / `@testing-library/dom` | `12.1.5` / `8.20.1` in all six | 16.x / 10.x | 12.x supports React up to 17; 16 takes `@testing-library/dom` 10 as a peer. `user-event` 14.6.7 stays |
| `react-beautiful-dnd` | `~13.1.1` in PortfolioWebParts | a maintained fork, or none | 3 files (the edit-view-columns panel). Unmaintained upstream; its React 18 story is the fork's |
| `react-calendar-timeline` | `0.28.0` in shared-library | the current line | 3 files (the timelines). React 18 compatibility to verify |

## Decisions

- **P5-1. React 18 follows SPFx, not the other way round.** The upgrade is made in the SPFx release
  that first allows React 18 in its peer ranges, and not before: a React above the platform's range
  is unsupported by Microsoft and a risk in every web part host. Until then, slice 3 makes the code
  ready (the two React-15-era peers replaced or confirmed), so the upgrade is a version bump when
  it comes. If no such SPFx exists when the rest of 1.15 is done, the user decides whether 1.15
  waits. **Settled 2026-10-05:** SPFx 1.24.0-rc.0 allows React below 19, and Microsoft has
  announced 1.24 GA for October; the user decided that 1.15 takes React 18 on 1.24 GA and ships in
  November.
- **P5-2. Order: xlsx first, Redux Toolkit second, React last.** Smallest and most isolated first;
  each is its own slice, commit series and test-channel run.
- **P5-3. Behaviour is pinned before each upgrade** (Decision D continues): the export, the
  reducers and the drag-and-drop panel get tests on the current versions first, so the upgrade's
  only job is to keep them green.
- **P5-4. Slice 4 starts on the release candidate** (2026-10-05). If 1.24 GA is not out when
  slice 3 is done, slice 4 runs on the newest RC, through CI and the test channel: only the tenant
  shows whether SharePoint serves React 18 to a 1.24 build. SPFx moves first, still on React 17,
  then React 18. GA replaces the RC as a version bump when it comes; 1.15.0 is never cut on an RC.
- **P5-5. Node stays on 22 for 1.15** (2026-10-05). SPFx 1.24 keeps Node 22 and adds 24 and 26,
  so nothing forces a change. Node 22 leaves maintenance on 2027-04-30, so the move comes after
  1.15 as a change of its own, in four places: `.nvmrc` (every workflow reads it),
  `nodeSupportedVersionRange` in `rush.json`, the Node guard in `Install/Build-Release.ps1` (22
  only), and the docs and skills that name Node 22.
- **P5-6. PnP's controls are not waited for** (2026-10-05). React reaches the page from
  SharePoint (see the inventory), so PnP's own `react` 17.0.1 puts no second React into a bundle:
  PnP's code runs on the React the manifest asks for. What is unproven is that code on React 18;
  slice 4's manual round covers the term field and the property panes, and a PnP release for SPFx
  1.24 is taken if it comes in time.
- **P5-7. xlsx: npm's 0.18.5 or SheetJS's 0.20.3** (open, for the user before slice 1's bump).
  0.18.5 is the plan's target and npm's last; it leaves the two high advisories (inventory), which
  only reading a file reaches, and the export only writes. SheetJS's CE 0.20.3 from
  `cdn.sheetjs.com` closes them too, as a tarball URL in `package.json` that pnpm resolves like any
  other version, at the price of a dependency from outside the registry. Recommended: 0.20.3.

## Slices and order

| # | Slice | Scope | Exit |
|---|---|---|---|
| 0 | Branch and baselines | New branch off `releases/1.15`, run by the test-channel workflow; record the inventory above, the test counts and the six package sizes | Baselines in this document |
| 1 | xlsx | The export's four tests run the real library but read only what reaches `aoa_to_sheet`: first a round trip of the written workbook (read back with `XLSX.read`) on 0.16; then the bump to the version P5-7 settles and whatever the changed `utils` surface needs; the download checked by hand on the test tenant | Export tests green on the new version |
| 2 | Redux Toolkit 2 | Reducer tests for the four without one (the program administration's is the model); then the bump: the seven object-notation reducers moved to the builder callback, which 2.x requires, `AnyAction` replaced by `UnknownAction` or the reducer's own action union, `rush update`; every web part with a reducer checked by hand | All reducers tested, green on 2.x |
| 3 | React 18 readiness | `react-beautiful-dnd` replaced by a maintained fork with the same API or by the panel's own ordering, `react-calendar-timeline` on a line that declares React 18, the 15 files that render with react-dom's `render` made ready for `createRoot` (the 7 without an unmount get one); nothing bumps yet | The two peers settled, tests green on React 17 |
| 4 | SPFx 1.24 and React 18 | The SPFx bump first, on React 17 (its own mini-phase on the toolchain plan's pattern; the RC until GA, P5-4); then React 18: `react`, `react-dom` and their types, `createRoot`, Testing Library 16 with `@testing-library/dom` 10 in all six, `children` declared where the 18 types want it, StrictMode findings fixed, the Fluent and Tabster versions revisited, the TagPicker stand-in rechecked (its loop was seen on React 17); full manual round on the test tenant, PnP's term field and property panes included (P5-6) | 1.15's definition of done |
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

- 1.24 GA may come later than a November 1.15 allows; P5-1 names who decides.
- SharePoint may not serve React 18 to an RC build before GA reaches the tenant: the manifest asks
  for React by version, and the package holds no copy. The test channel shows it in slice 4 (P5-4).
- PnP's controls run on React 18 without PnP having tested them there (P5-6).
- Testing Library 16 under some 860 tests: React 18's `act` rules and automatic batching surface
  as warnings and changed timing across the suites.
- `react-beautiful-dnd` has no upstream maintenance; a fork is a new dependency with its own
  lifetime, and the panel's own ordering may be the smaller risk.
- Redux Toolkit 2 rejects the object notation seven reducers use, so each is rewritten to the
  builder callback; the reducer tests of slice 2 are what keep the rewrite honest.
- Budget: three small slices and a large fourth; keep agents focused and sequential.

## Definition of done

`@reduxjs/toolkit` 2.x and `xlsx` on the version P5-7 settles in every solution that uses them,
with tests on the export and every reducer; the two React-15-era peers replaced or on a line that
declares React 18; SPFx 1.24 GA and React 18 in all six solutions (P5-1), or, if GA comes too late
for November, the user's decision recorded under P5-1; the release note for 1.15 complete; 1.15.0
cut when the user says so.

## Slice log

### Slice 0 — branch and baselines (2026-10-05)

Branch `feat/dependency-upgrades-phase-5` off `releases/1.15` at `bba23bc05`, phase 4's squash
(#1778). `ci-channel-test.yml` runs on `feat/dependency-upgrades*` too, so each slice's push
upgrades the test channel and runs the browser suite as in phases 3 and 4.

The baselines come from the run the merge started on `releases/1.15` (37281142558: the full
release build, the full upgrade with templates, the browser suite 31 of 31), whose tree is phase
4's close-out. The CI log prints no per-project test totals, so the counts are the close-out's
full runs; nothing under `src` has changed since.

| Solution | Tests | Test files | Floors (stmts/branches/funcs/lines) |
|---|---|---|---|
| shared-library | 378 | 52 | 72/78/52/72 |
| PortfolioWebParts | 101 | 21 | 56/61/42/56 |
| ProjectWebParts | 145 | 34 | 42/66/48/42 |
| ProjectExtensions | 109 | 20 | 49/78/64/49 |
| ProgramWebParts | 30 | 7 | 38/72/60/38 |
| PortfolioExtensions | 100 | 10 | 37/75/67/37 |
| **All** | **863** | **144** | |

Lint: 210 house-rule warnings, phase 4's allow-list. Browser suite: 31 tests. Packages from the
same run (test channel, MiB, measured as phase 4 did): PortfolioWebParts 6.76, ProjectWebParts
4.63, ProgramWebParts 3.44, the shared library 1.38, PortfolioExtensions 1.42, ProjectExtensions
1.11, 18.74 in all, the close-out's to the hundredth. The page bundles, uncompressed: the overview
4.04, the aggregation 3.80, project information 2.37, the status page 2.32. React is not in them
(inventory), so React 18 should not move them; xlsx and Redux Toolkit can.

**The platform on 2026-10-05.** SPFx `latest` is 1.23.2 and `next` 1.24.0-rc.0, which allows
React 18 and Node 22, 24 and 26; Microsoft has announced GA for October. That settles P5-1, and
P5-4 to P5-6 record how slice 4 and the time after 1.15 go. The recount found what slice 2 must
do beyond the plan's first draft: seven of the nine reducers use the object notation Redux Toolkit
2 removed. And the xlsx the plan named leaves two high advisories open, which P5-7 puts to the
user.
