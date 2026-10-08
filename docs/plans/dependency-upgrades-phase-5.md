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
| `xlsx` | `^0.16.9` in shared-library | SheetJS's own 0.20.3 (P5-7) | 1 file (`ExcelExportService`), six calls: `utils.aoa_to_sheet`, `book_append_sheet`, `book_new`, `json_to_sheet`, `sheet_to_json`, `write`; four tests since phase 4 run the real library. npm's last release is 0.18.5 (2022): it fixes the three denial-of-service advisories against 0.16 (CVE-2021-32012 to 32014), not the two high ones, prototype pollution when a file is read (CVE-2023-30533, fixed in 0.19.3) and a ReDoS (CVE-2024-22363, fixed in 0.20.2), whose fixes SheetJS publishes only on `cdn.sheetjs.com` |
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
- **P5-7. xlsx: SheetJS's 0.20.3, not npm's 0.18.5** (decided by the user 2026-10-05). 0.18.5
  was the plan's target and is npm's last; it leaves the two high advisories (inventory), which
  only reading a file reaches, and the export only writes. SheetJS's CE 0.20.3 from
  `cdn.sheetjs.com` closes them too, as a tarball URL in `package.json` that pnpm resolves like any
  other version, at the price of a dependency from outside the registry.

- **P5-8. The Excel export exports what is shown** (the user, 2026-10-06): the active search as
  well as the filters, in all three exports (portfolio overview, aggregated overviews, dynamic list).
- **P5-9. Yes/No columns export as Excel's own true/false** (shown as SANN/USANN in Norwegian Excel),
  unless keeping the text "Ja"/"Nei" proves simpler; slice 2b records which (the user, 2026-10-06).
- **P5-10. Numbers export as their value rounded to two decimals**, never floored (the user,
  2026-10-06).
- **P5-11. `react-calendar-timeline` stays on 0.28; `react-beautiful-dnd` becomes
  `@hello-pangea/dnd` ~16.6** (the user, 2026-10-06, on the recommendation from npm on that day).
  0.28 declares `react >=16.3`, React 18 included; its unmet peer is `create-react-context`, which
  exports React's own `createContext` when React has one. The current line is a beta (0.30.0-beta),
  requires React 18 and moves from `moment` to `dayjs`, so it waits for a release after 1.15; slice 4
  tries the timelines on React 18. `@hello-pangea/dnd` is the maintained fork with the same API;
  16.6 declares React 16.8, 17 and 18, while 17 and 18 require React 18, so 16.6 goes in now and
  works on both sides of slice 4.

## Slices and order

| # | Slice | Scope | Exit |
|---|---|---|---|
| 0 | Branch and baselines | New branch off `releases/1.15`, run by the test-channel workflow; record the inventory above, the test counts and the six package sizes | Baselines in this document |
| 1 | xlsx | The export's four tests run the real library but read only what reaches `aoa_to_sheet`: first a round trip of the written workbook (read back with `XLSX.read`) on 0.16; then the bump to the version P5-7 settles and whatever the changed `utils` surface needs; the download checked by hand on the test tenant | Export tests green on the new version |
| 1b | Agent skills and onboarding (added by the user 2026-10-05, between 1 and 2) | One source for the skills: Copilot reads `.claude/skills` as Claude Code does, so the hand-made copy in `.github/skills` (whose `pp365-testing` had fallen behind) goes, and a check in CI stops a second copy from coming back; three new skills, thin and pointing at the guide: `pp365-ui` (components, Fluent v9, our wrappers), `pp365-templates` (content model, provisioning, upgrades) and `pp365-release` (branches, commit tags, CI, channels, changelog and release notes); the two existing skills and `AGENTS.md` corrected against the code; four notes that lived only in an agent's personal memory moved into them; each new skill tried on a typical task by a fresh agent; a first-week path for new developers in Norwegian (`.development-guide/kom-i-gang.md`) | Done 2026-10-06: one copy of each skill and the check in CI; three new skills and two corrected; `AGENTS.md`, the onboarding chapter `.development-guide/kom-i-gang.md`, and the guide where it contradicted the code |
| 1c | CI build time (added by the user 2026-10-05; runs after 1, before 1b) | A debug workflow that builds the release package without touching the tenant, so the live workflows stay as they are until each change is proven; `Build-Release.ps1` switches, off by default: the rebuild's per-project timeline printed and its logs uploaded, PnP.PowerShell (and its version check, which ends the script with `exit 0` when the module is missing) skipped when the PnP templates are, and a phased Rush rebuild in which a solution starts once the solutions it depends on have compiled, instead of after their tests, bundles and packages | Done 2026-10-06: per-project times measured; the timeline and the PnP.PowerShell skip in the live packages-only job; the phased rebuild tried and not adopted (slower on the 4-core runner); narrowing `[apps-only:<solution>]` builds left for after phase 5 |
| 2a | Redux Toolkit 2 | Tests first, so that every handler of the nine reducers is exercised (41 actions had no test on 2026-10-06, 17 of them in the aggregation's; the program administration's test is the model); then the bump: the seven object-notation reducers moved to the builder callback, which 2.x requires, `AnyAction` replaced by `UnknownAction` or the reducer's own action union, the shared library's unused `@reduxjs/toolkit` dropped, `rush update`; `kodemonster.md`'s reducer example on the builder; the coverage floors raised to what the tests reached; every web part with a reducer checked by hand | Step 1 done 2026-10-06 (every handler tested on 1.9.5); step 2 done 2026-10-06 (2.13.0, all tests green unchanged); checked by hand on the test tenant 2026-10-06 |
| 2b | Fixes found in slices 1 to 1b (added by the user 2026-10-06, in place of filing issues) | Each a commit of its own with a test and a changelog line, apart from 2a's no-change upgrade. Excel export: a failed export shows a message; it exports what is shown (P5-8); `false` and `0` export as values, not empty cells (P5-9); numbers rounded to two decimals, not floored (P5-10); `æøå` kept in file names; ` \| ` and `;#` parsed only in person and lookup columns; measurement dates read without a locale round trip; the dynamic list's Norwegian plural. Upgrade and templates: `UpgradeAllSitesToLatest` on English installations; `Prosjektkolonner`'s id comments and the `GtStatusOpportunities` lookup; `channels/kurs.json`. Packaging and CI: the loc test no longer shipped as a locale; `generate-sbom.yml` on tags; `sync-version` across all projects. Accessibility and docs: `@BaseDialog`'s close button label, `IBasePanelProps.hidden`'s description, the templates and release chapters of the guide. Reducers (found by 2a's tests; each test that pins the fault changes with its fix): the status page survives a failed report delete; the program administration's delete button comes back after a failed delete; in the aggregated overview, "Liste" and "Kompakt" set the mode instead of flipping it, ungrouping keeps the chosen sort direction, a refetch keeps the grouping, a `viewId` first in the query string is found, a deleted column leaves the show/hide panel, and a failed fetch ends the loading; the portfolio overview writes the new grouping to the address; project information's properties built from `current(state)` after an update | Done 2026-10-06 (each code fix tested, seen failing first; the changelog lists the user-visible ones); checked by hand on the test tenant 2026-10-06, the change-phase dialog's fix included |
| 3 | React 18 readiness | `react-beautiful-dnd` replaced by `@hello-pangea/dnd` ~16.6 and `react-calendar-timeline` kept on 0.28 (P5-11); the unused `react-autocomplete`, `react-image-fade-in` and `react-scroll` removed; the 15 files that render with react-dom's `render` through one shared-library helper, so that slice 4 moves to `createRoot` in one place (of the 7 without an unmount of their own, 6 have their base class's or an equivalent; the footer has none, and leaks a mounted footer on every navigation); nothing else bumps | Done 2026-10-06 (peers settled, every suite green on React 17); the hand check on the test tenant |
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

### Slice 1 — xlsx, the guard and the tests (2026-10-05)

**Investigation.** Six agents compared 0.16.9 with SheetJS CE 0.20.3 before anything changed: the
export's pipeline ported verbatim and run under both versions in 550 cases (cells read back with
both readers), the written files unzipped and diffed part by part in 61 cases, the dependency
mechanics tried in a throwaway Rush repo, the types, webpack resolution and bundle size, the test
design, and a critic over all five, which checked contradictions in a headless Chromium. For
realistic data every value, type and sheet name is the same. The package differs only in its
container (an extra `xl/metadata.xml`, another ZIP layout), byte-identical to npm's 0.18.5, which
has some 16 million downloads a week. In the browser the export is as fast as before, and webpack
takes `xlsx.mjs`: the library's share of a bundle drops from about 911 KB to 320 KB minified, with
the codepage tables and JSZip gone. TypeScript compiles our code unchanged against either version.

**What 0.20.3 refuses.** Four inputs 0.16.9 wrote and Excel does not accept: text over 32,767
characters in a cell (a note column holds up to 63,999), and as a sheet name, which is the web
part's title, a name with `:`, one that starts or ends with an apostrophe, or `History`. All three
callers swallow the export's errors, so the user would get neither a file nor a message. Names
over 31 characters already fail on both versions: three provisioned titles per language on the
child-project pages (32, 37 and 36 characters in Norwegian, 38, 39 and 32 in English).

**The guard**, in `ExcelExportService` before the bump: `toSheetName` replaces `: \ / ? * [ ]`
with a space, trims apostrophes and whitespace at both ends, cuts to 31 characters, falls back to
`Sheet1` when nothing is left, and numbers `History` and a name already used (the measurements
sheet's included); `truncate` cuts text to 32,767 characters without splitting a surrogate pair,
since a lone surrogate corrupts the sheet in the browser on both versions. Realistic output is
byte-identical with and without it. It is an intended visible difference, in the changelog and the
release note: the long titles export now, cut to 31 characters. The dead `sheetName`,
`fileSaverVersion` and `xlsxVersion` settings are gone from the configuration.

**Tests.** `ExcelExportService.test.ts` has 18 tests, 14 of them new and all on the saved file
rather than on calls into xlsx: the file read back from the Blob `saveAs` receives (through
`FileReader`, since jsdom's Blob has no `arrayBuffer()`), each cell's value and type in both
sheets, a package check (the main content type, every XML part well-formed and UTF-8, since
SheetJS reads back files Excel refuses), the names, the measurements sheet's number, and the cut
with an emoji across the limit. They pin today's behaviour, defects included (a `false`, `0` or
`''` exports as an empty cell). 18 of 18 pass on 0.16.9 here; the critic's run passed them on both
versions, and a mutation run showed they catch a number written as text, a renamed or missing
sheet and a naive cut, where the four spy tests did not. The browser suite gets one read-only test
(`smoke/portfolio.spec.ts`): the hub's overview exports, and the download is an xlsx package. It is
the only test of the path users run, SheetJS's ES module build in a browser.

**Install.** `Build-Release.ps1` kept no output of `rush install` and ignored its exit code, so a
failed install surfaced as a rebuild that could not link. It now logs the install to
`SharePointFramework/rush-<install|update>.build.log` and stops with its last 50 lines. With the
tarball, an install from an empty store needs `cdn.sheetjs.com` to answer.

**Order.** The guard and the tests land on 0.16.9 first, with a push and a green run; the bump
follows as its own commit, `package.json` and the lockfile only, with no test changed (P5-3).

**The first run (37300026442)** built and upgraded green, and the new browser test waited 90 s for
an export button the test hub's overview does not show: its toolbar held only the view selector
and the filter. The hub template turns the button on, but the installed page has the property off.
The test now waits for the toolbar and skips with that reason when the button is missing, as the
suite does for a page that does not exist; the property is turned on in the test hub.

**Accepted with the bump.** GitHub's dependency graph and Dependabot cannot follow a URL
dependency: future xlsx advisories raise no alert, so the release checklist gets a look at
SheetJS's advisories. Scanners that read the npm advisory ranges, which have no fixed version on
npm, may still list the two advisories against 0.20.3. Both need a file to be read (SheetJS's own
advisory says so for CVE-2023-30533; the 0.20.2 fix touched only parsing), and the export only
writes, so the bump is hygiene, not a fix for an exploitable path.

**Found and left**, for issues rather than this slice: failed exports show nothing to the user;
`getObjectValue` turns `false`, `0` and `''` into empty cells; `parseDisplayValue` rewrites any
text with ` | ` or `;#` (`Prosjekt A | Bydel Nord` exports as `Bydel Nord`); measurement dates
come from `toLocaleDateString()` and are parsed back with `new Date()`; the callers round numbers
down (`-0.5` exports as `-1`); no export applies an active search; file names turn `æøå` into `-`;
`DynamicList`'s tooltip for exporting a selection uses the English plural in Norwegian;
`getDateForExcelExport`'s JSDoc promises a `Date` but it returns strings.

**Manual gate before merge:** on the test tenant, a one-sheet export (`Porteføljeoversikt`) and a
two-sheet one (`Nytteoversikt`) from the 0.20.3 build open in Excel desktop and in Excel for the
web without a repair prompt, and a `Dynamisk liste` titled with a `:` exports with the cleaned name.

### Found on the tenant between slices: the hub's column headers (2026-10-05)

Phase 4's list wrapped a long column name onto more lines. Fluent v9's header button keeps the
width of its content (overflow visible, no `min-width`), so it did not shrink with the column.
The button now stays within the column, and the name sits on one line, ending in an ellipsis as in
v8's list, with the whole name as its tooltip (`ListGrid`, one test). It reaches the program's
overviews too, which bundle PortfolioWebParts' list.

The manual check found it working, and found the browser's own resize grip in the header's corner:
Fluent's reset styles give the header button `resize: horizontal`, which a browser ignores while
overflow is visible and honours once it is hidden. The button has `resize: none` now (checked in a
headless Chromium), and the overview's smoke test reads the header's computed styles in the
browser (no `resize`, overflow hidden, the name on one line ending in an ellipsis), since no unit
test applies CSS.

### Slice 1 — the bump (2026-10-05)

With the guard and the tests green on 0.16.9 in CI (37311342282, 37316101049: the export test ran
and passed in the browser, 32 of 32), `shared-library/package.json` takes
`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`, and `rush update` writes the tarball and
its integrity (`sha512-oLDq3jw7…`, the CDN's) into the lockfile; xlsx's ten dependencies leave it
(other packages keep their own `commander` and `fflate`). No test changes: TypeScript compiles the
shared library against 0.20.3's types, and the export's 18 tests pass on it. 0.20.3's `exports` map
does not expose `package.json`, so `require('xlsx/package.json')` fails; nothing in the repo does
that. `rush update` also lists React-15/16-era peers beyond the inventory's two, which slice 3
takes in: `react-autocomplete` (ProjectExtensions), `react-image-fade-in` and `react-scroll`
(ProjectWebParts), and `create-react-context` under `react-calendar-timeline`.

### Slice 1c — CI build time, step 1: measure (2026-10-05)

The live packages-only job took 782 s (run 37316101049), 724 s of it the one `rush rebuild` of all
eleven projects that `Build-Release.ps1` runs before it packages; the install took 42 s and
PnP.PowerShell 14 s. Nothing builds twice: in the SPFx rig `package-solution` is a phase of its own
with no dependencies, so it packages what `heft test` built. Two things make the rebuild long. The
web parts form a chain (shared-library, ProjectWebParts, PortfolioWebParts, ProgramWebParts), and
each waits for the previous one's whole build (lint, Jest with coverage, the production bundle, the
package) though it needs only its compiled `lib/`; and `[apps-only:X]` narrows the packaging and the
deployment, not the build, since a rebuild with `--to` once left a `.sppkg` out.

Step 1 adds what measures, without changing the live workflows:

- `.github/workflows/ci-build-debug.yml`: builds the test channel's package as the live
  packages-only job does, on a push whose subject carries `[build-debug]` (with `[skip-ci]` the live
  workflow stays idle), with no secrets and no deployment, and uploads the package and the Rush logs.
  A push trigger, because `workflow_dispatch` works only once the file is on the default branch.
- `Build-Release.ps1 -RushTimeline`: the rebuild runs with Rush's `--timeline`; the time per
  project, longest first, and Rush's chart (total work, wall clock, parallelism) go to the log and
  to the job summary. Tried against a two-project rebuild locally.
- `Build-Release.ps1 -SkipPnPPowerShell` (with `-SkipBuildPnPTemplates` only): no install, import
  or version check of PnP.PowerShell. That check used to end the script with `exit 0` when the
  module was missing, so a CI job went green without packages; it exits 1 now, the one change the
  live jobs see.

The CI guide (`kontinuerlig-integrasjon.md`) has the tag and the workflow. Step 2, the phased
rebuild, follows the numbers: each solution needs a Heft phase of its own for the compile, since
all six use the rig as it is, and the debug workflow swaps that configuration in, so the live
builds keep theirs until the phased build's packages are shown to equal them.

### Between slices: watching and debugging a solution (2026-10-05)

`npm run watch` in PortfolioWebParts failed with `Can't resolve '../Autocomplete'`: a watch builds
only its own solution and bundles the shared library and ProjectWebParts from their `lib/`, which
on the developer's machine dated from before phase 4's slice 7 (with only declarations for the two
rewritten components). The code was fine; building the two (`heft build --clean`) made the watch
compile in 11 s and recompile in about 15 s after an edit. The debug setup needed three fixes: the
launch samples mapped only the solution's own sources, not `webpack:///../../<solution>/src/...`
where webpack 5 puts the shared library's and ProjectWebParts' (3,121 of the overview bundle's
sources resolve now, against 81); the root sample, the one VS Code reads with the repo open, still
had a placeholder solution and the workbench; and `LAUNCH_CONFIGURATIONS`, which `createLaunchFile`
reads, was in neither the template nor the guide. The guide (`utviklingsmiljo.md`) now says to
build the dependencies first, that `SERVE_CHANNEL` must match the page's channel (`test` on the test
tenant, or the page keeps the deployed bundles), and how to debug from VS Code. Slice 1b's
`.development-guide/kom-i-gang.md` builds on it.

### Between slices: the measurements dialog in the benefit overview (2026-10-05)

A click inside `Vis alle målinger`'s dialog, or on its backdrop to close it, selected the row the
dialog came from. Fluent's `Dialog` is portalled to the end of the page, outside the row, but React
passes its clicks up through the row, and the row's check for a click of its own looked only at the
DOM. The row now leaves its selection alone for any click that did not land inside it, which covers
every dialog, popover and menu a cell opens (`ListGrid`, one test, which fails without the change).
The dialog had no close button since phase 3 put it on v9: it has the title's dismiss button and a
`Lukk` under the list now (`DialogColumn`, one test).

### Slice 1c, step 1: the numbers (2026-10-05)

The first debug run (37321980652) built in 753 s, 714 s of them the rebuild: 1,008 s of work done
in 711 s of wall clock, at an average parallelism of 1.4 of the 2 allowed. The critical path is the
chain and nothing else: shared-library 144.7 s, ProjectWebParts 300.0 s, PortfolioWebParts 175.0 s
and ProgramWebParts 91.3 s add up to the 711 s; the two extensions (127.1 and 166.3 s) run beside
ProjectWebParts and cost no time. Heft's own phases, from the per-project logs:

| Solution | Build (Sass, TypeScript, lint, webpack) | Jest | Package |
|---|---|---|---|
| shared-library | 61.9 s | 80.9 s (392 tests) | 0.7 s |
| ProjectWebParts | 172.2 s | 125.0 s (145 tests) | 1.9 s |
| PortfolioWebParts | 127.2 s | 44.5 s (102 tests) | 2.4 s |
| ProgramWebParts | 75.6 s | 13.6 s (30 tests) | 1.3 s |

264 s of the critical path is Jest, which no dependent needs. So step 2 is simpler than planned:
no Heft phase of our own (and so no question of resolving the rig's plugins from a solution's
`heft.json`), but two Rush phases per solution, `_phase:build` (`heft build --clean --production`)
and `_phase:test` (Jest on the built output, then `package-solution`), a dependent's build waiting
only for its dependencies' builds. The tests then run beside the next build; webpack stays on the
path. Rush schedules by critical path, so the gain is bounded by parallelism 2 more than by the
chain; the debug run measures both 2 and 3. Splitting TypeScript from webpack is a later step if
the numbers ask for it. The timeline's per-project list also missed the times Rush writes as
"2 minutes 24.7 seconds"; it reads them now.

### Slice 1c, step 2: the phased rebuild in the debug workflow (2026-10-05)

`common/config/rush/command-line.json` gets two phases and a phased command, `rebuild-phased`:
`_phase:build` waits for the dependencies' `_phase:build`, and `_phase:test` for the project's own
build only. The six solutions run `heft build --clean --production` in the first and
`heft run --only test -- --production`, then `package-solution` (the shared library's runtime tests
between them), in the second; Templates, the Jest harness and e2e run their `build` script in the
first. Projects without a phase script are skipped (`missingScriptBehavior: silent`). `rush rebuild`
and every `build` script are as they were, so the live builds do not change.

`Build-Release.ps1 -PhasedBuild` runs `rebuild-phased`. Rush logs each phase on its own
(`<package>._phase_build.log`, `<package>._phase_test.log`), so the scans for Jest's failures and the
missed coverage floors read those in that mode; with `*.build.log` they would have found nothing and
let a missed floor through. The debug workflow builds three variants of one commit side by side,
`classic` (today's rebuild), `phased-p2` and `phased-p3`, and a job compares every `.sppkg`'s contents
with `classic`'s, file by file, and tables the wall clocks. Tried locally: Rush accepts the
configuration and names the operations `<package> (build)` and `(test)`; ProgramWebParts' phased
rebuild built in 27 s, tested in 53 s (30 tests) and packaged; the comparison passes identical
packages and names the file in an altered one.

### Slice 1c, step 2: the result (2026-10-06)

The debug run (37432085827) built the three variants on three runners:

| Variant | Wall clock | Total work | Average parallelism |
|---|---|---|---|
| classic | 506.1 s | 718.0 s | 1.4 |
| phased-p2 | 709.8 s | 1,224.5 s | 1.7 |
| phased-p3 | 673.8 s | 1,482.7 s | 2.2 |

The phased rebuild is slower. The build is CPU-bound on the 4-core runner, and each process already
spreads over the cores (Jest's three workers, webpack's parallel minifier), so a test phase beside
the next build makes both slower: ProjectWebParts' build alone took 209 s phased, as long as its
build and tests together in classic (213 s), and the shared library's tests 158 s, against 102 s
for the whole project in classic. The chain of builds stays the critical path. The runners vary
too: classic took 711 s the day before and 506 s here, so only times from one run compare, and a
70 % rise in total work is well beyond that spread.

The packages are equivalent: the same 464 files in every variant, every bundle identical, and the
XML that differs differs only in what `package-solution` generates per run, the client side assets
feature's GUID and the relationship counter (`Id="r5"`); masked, nothing differs. The comparison
job flagged those, so it needs the same masking to be of use.

Not adopted: the phased rebuild would pay only on a runner with more cores. What does save time is
less work (narrowing an `[apps-only:<solution>]` build to the solution and its dependencies, which
`Build-Release.ps1` gave up on once) and the 14 s of PnP.PowerShell.

### Slice 1c — closed (2026-10-06)

Kept: the debug workflow (`ci-build-debug.yml`, one build, the live packages-only job's arguments),
where the next change to the build is tried before the live workflows take it, and the two
switches, now on in the live packages-only job: `-RushTimeline` (the time per project in the job
summary of every `[apps-only]` run) and `-SkipPnPPowerShell` (14 s). Removed: the phased rebuild
(`rebuild-phased`, its two phases in `command-line.json`, the phase scripts in nine `package.json`
files, `-PhasedBuild`), so no configuration is left that nothing runs; this log and the CI guide keep
what it showed. Narrowing an `[apps-only:<solution>]` build to the solution and its dependencies,
the one change measured to save minutes, is left out of phase 5 (the user, 2026-10-06).

### Slice 1b — skills and onboarding (2026-10-06)

**One copy.** Every Copilot surface that loads skills (VS Code, Visual Studio, JetBrains, the
Copilot CLI and cloud agent) reads `.claude/skills`, as Claude Code does, so the hand-made copy in
`.github/skills` went: seventeen of its files were identical, the eighteenth was a stale
`pp365-testing`. `.tasks/check-skills.js` (`npm run check-skills`, and `skills.yml` on pushes and
pull requests touching skills, `[skip-ci]` or not) fails when a second copy appears or a `SKILL.md`
breaks the frontmatter rules Copilot applies (`name` equal to the folder, a description of at most
1,024 characters); tried both ways.

**Three new skills**, each drafted by an agent from the guide, the code, the phase plans and the
notes that lived in one developer's agent memory, then fact-checked by a second agent and tried on a
typical task by a third (adding a panel to project information; a new project property from field to
upgrade; a fix through commit, CI, changelog and pull request), and revised from both: `pp365-ui`
(131 lines; 52 claims held, 7 wrong), `pp365-templates` (135; 56 and 5) and `pp365-release` (143; 41
and 9); every trial scored 4 of 5 on the draft. The four memory notes (Fluent v9 flicker, the pnpm
store and validate-loc, stale bundles after a deploy, the local sp-js-provisioning runner) were
checked, corrected where wrong (`localization-report.md` is gitignored, not tracked) and moved in.
`pp365-toolchain` (108 lines, from 124) and `pp365-testing` (75) are corrected on 25 outdated points,
`AGENTS.md` on 13 (where Jest runs, what `validate-loc` does not gate, the coverage floors, the lint
rules, the Rush projects, the typings names) and lists the skills. `.development-guide/kom-i-gang.md`
(first written as a root `ONBOARDING.md`, moved into the guide at the user's request) is a first-week
path in Norwegian, with access and where to ask filled in by the user.

**The guide, where the review found it contradicting the code:** `testing.md` (the floors were "not
switched on"; branches; the e2e folders), `npm-skript.md` (`Build-Release.ps1`'s case; the build
scripts), `commit-praksis.md` (tags and workflows, now a pointer to the CI chapter),
`kontinuerlig-integrasjon.md` (the workflow table listed three in `unused/`; `[apps-only]` and any
`Templates/` change), `kodemonster.md` (`format` from v8, typings beside the source, `myStrings.d.ts`
everywhere, a hard-coded colour; a comments section; now in the generated README). Also:
`jest-shared.config.json`'s comment and `Build-Release.ps1`'s message no longer suggest lowering a
floor, and the two extension solutions' `validate-loc` passes `--dts myStrings.d.ts`, their file's
real name, which on Linux would otherwise fail.

**Found and left, for issues:** `UpgradeAllSitesToLatest.ps1` looks for the list title
`Prosjektegenskaper`, so English installations run no per-site upgrade step; the `<!-- ID -->`
comments in `Prosjektkolonner.xml` are wrong from row 34, and the three `GtStatusOpportunities` rows
look up 54 where that column is row 36; `channels/kurs.json` lists `DynamicListWebPart` under the
wrong solution with a stale id; `shared-library/src/loc/strings.test.ts` ships in the package as a
locale bundle (`SharedLibraryStrings_strings.test.js`); `generate-sbom.yml` fails on every tag push;
`sync-version` skips the dot folders, `Templates` and `e2e`; `@BaseDialog`'s close button has no
`aria-label`; `IBasePanelProps.hidden` hides only the header; the templates guide
(`maler/*.md`) and the release guide (`opprette-ny-versjon.md`, `npm.md`) predate the current layout
and process; `kodemonster.md`'s reducer example uses the object notation slice 2 removes.

### Slice 2a, step 1 — every reducer handler tested on 1.9.5 (2026-10-06)

Three agents, one per solution group, each told to pin what a handler does today, faults included,
and to change no product code. Every handler of the nine reducers now runs in a test: 134 tests in
nine files, up from 36 in five.

| Reducer | Tests before | After |
|---|---|---|
| PortfolioAggregation | 0 (new file) | 49 |
| PortfolioOverview | 12 | 21 |
| ProjectInformation | 0 (new file) | 10 |
| ProjectPhases | 0 (new file) | 9 |
| ChangePhaseDialog | 6 | 7 |
| ProjectStatus | 8 | 13 |
| ProjectSetupDialog | 7 | 7 |
| DocumentTemplateDialog | 0 (new file) | 9 |
| ProgramAdministration | 3 | 9 |

Run together through the fast loop (tsc to `lib-commonjs`, `heft run --only test`): all pass;
ESLint, Prettier and tsc clean. Two reducers are created inside their hooks (ProjectInformation,
ChangePhaseDialog), so their tests run the hook through `ProjectPhases/ChangePhaseDialog/testHooks.ts`.
The aggregation's column handlers are checked through a `jest.fn` passed as `onUpdateProperty`, so
nothing is mocked.

**Faults the tests pin**, the user-visible ones moved to 2b:

- ProjectStatus: `useDeleteReport` dispatches `REPORT_DELETE_ERROR()` without a payload (allowed
  while `strictNullChecks` is off) and the handler reads `payload.error`, so a failed delete throws
  inside `useReducer` and the web part falls to its error boundary.
- ProgramAdministration: `Commands.tsx` sets `isDeleting` and has no `.catch`, so after a failed
  delete the button stays disabled until the page reloads.
- PortfolioAggregation: `TOGGLE_COMPACT` ignores its payload and always flips; "A til Å" sends
  `isSortedDescending: true`, which `SET_SORT` sorts ascending while ungrouping and `DATA_FETCHED`
  read it as reversed; `SET_GROUP_BY` toggles and the fetch dispatches it after every fetch, so a
  refetch may ungroup (read from the code, not reproduced); `SET_CURRENT_VIEW` parses
  `document.location.href` with `URLSearchParams`, so a `viewId` first in the query string is missed
  and a later one takes in the hash; `COLUMN_DELETED` leaves the column in `allColumnsForCategory`;
  `DATA_FETCH_ERROR` leaves `loading` true; `DATA_FETCHED` without columns returns early with
  `loading` true, and with columns but no data source throws (the fetch always sends one).
- PortfolioOverview: `DATA_FETCHED` writes `state.groupBy` to the hash before taking the new one;
  `EXCEL_EXPORT_ERROR` keeps no error (already in 2b: a failed export shows a message).
- ProjectInformation: `UPDATE_DATA` builds the properties from the draft, not `current(state)` as
  `INIT_DATA` does, so without `fields` in the payload they hold revoked proxies (the save always
  sends fields today).
- ProjectPhases: `CHANGE_PHASE` reads `state.popover.phase` unguarded; unreachable from the UI, left.

**Pinned as intended, or left:** the address hash wins over a changed default view (the address is
what a shared link carries); `SET_PHASE` leaves `confirmPhase` set and `data.currentPhase` old (the
page reloads when properties are synced); `CustomError` and `PortfolioAggregationErrorMessage` are
plain `Error`s under the ES5 target, and nothing checks their class; `SET_VIEW_FORM_PANEL`'s type
string is `TOGGLE_VIEW_FORM_PANEL` (the builder matches on the creator); several aggregation handlers
mutate class instances (`setData` on columns) that immer does not draft.

**For the rewrite:** `usePortfolioAggregation.ts` dispatches the creator `SET_CURRENT_VIEW`, not
`SET_CURRENT_VIEW()`, which works because the reducer reads `.type` (pinned; the call gets its
parentheses in step 2); ProjectStatus keys `REPORT_PUBLISH_ERROR` by a string literal, not
`[REPORT_PUBLISH_ERROR.type]`; the CLEAR_USER_MESSAGE JSDoc is headed `PERSIST_SECTION_DATA_ERROR`.

### Slice 2a, step 2 — Redux Toolkit 2.13 (2026-10-06)

Step 1's tests ran green in the debug workflow (run 37443881924) before anything moved.

**The bump.** `@reduxjs/toolkit` `~1.9.5` to `~2.13.0` in the four solutions that use it, and out of
the shared library, which declared it and never imported it. `rush update` resolves 2.13.0 with
immer 11.1.21, redux 5.0.1, reselect 5.3.0 and redux-thunk 3.1.0. A redux 4.2.1 stays in the tree
for react-redux 7, which `react-beautiful-dnd` brings (slice 3). Jest's conditions (`browser`,
`require`, `default`) resolve RTK's and immer's CommonJS builds, and webpack's `import` condition
resolves the modern ESM build, so neither needed configuration.

**The rewrite.** The seven object-notation reducers moved to the builder callback by a small
converter. It kept every handler body as it was, in the same order: 7, 6, 7, 8, 4, 14 and 19 cases.
A whitespace-blind diff shows only the structural lines. Two details changed:
- ProjectStatus's `REPORT_PUBLISH_ERROR`, keyed by a string literal, now matches on its creator.
- `ProjectSetupDialog` keeps `state: IProjectSetupDialogState` on the three handlers that pass
  `state.selectedTemplate` to a method. Immer's `Draft` drops `ProjectTemplate`'s private members,
  so the draft would not type-check there. With `strict` off, the annotation is accepted
  bivariantly, as before.

`AnyAction` is `UnknownAction` in its 11 files, and the aggregation dispatches
`SET_CURRENT_VIEW()` instead of the creator. `kodemonster.md`'s example and the `pp365-ui` skill now
show the builder, and the changelog's technical bullet names Redux Toolkit 2.13 and SheetJS 0.20.3.

**Result.** tsc clean in the four solutions. Every suite passes with no test changed: 484 tests in
86 suites (PortfolioWebParts 160, ProjectWebParts 170, ProjectExtensions 118, ProgramWebParts 36).
RTK 1.9's deprecation warning is gone, and ESLint and Prettier are clean. Coverage from the same
run raised the floors. They are rounded down, and branches within half a point of the integer go a
point lower, so a small difference between the local and CI measurement does not fail the build:

| Solution | Floors before (s/b/f/l) | Measured | Floors now |
|---|---|---|---|
| PortfolioWebParts | 56/61/42/56 | 61.15/71.31/47.85/61.15 | 61/70/47/61 |
| ProjectWebParts | 42/66/48/42 | 45.92/70.15/50.92/45.92 | 45/70/50/45 |
| ProjectExtensions | 49/78/64/49 | 52.64/81.69/68.58/52.64 | 52/81/68/52 |
| ProgramWebParts | 38/72/60/38 | 41.71/77.27/63.63/41.71 | 41/76/63/41 |

### Slice 2b — the fixes (2026-10-06)

Five areas, each its own commit: the Excel export (main session), the reducers, templates and
upgrade, packaging and CI with two accessibility fixes, and the guide's templates and release
chapters (one agent each, none of them running git).

**Excel export.** The shared service now does what the three callers each did their own way, and
does it by the column's data type, read as `renderItemColumn` reads it (`dataType`, `data.type`,
`data.renderAs`):
- **P5-8:** each export takes the rows the list shows, from the same function as the list:
  `filterItems` in the portfolio overview, `getFilteredItems` in the aggregated overview (which also
  makes the export filter on project refiners through `__projectRefinerValues`, as the list does) and
  `filterListItems` in the dynamic list. Selected rows win, as before.
- **P5-9: Excel's own true/false.** `isTrueBooleanValue` covers both shapes (`'1'`/`'0'` from search,
  booleans over REST); a missing value is `false`, as the list renders it. A column's own labels
  (`valueIfTrue`/`valueIfFalse`) are not used in the export.
- **P5-10:** numbers, currency and numeric text are rounded to two decimals, never floored, and get the
  number format `#,##0.00`; percentages are numbers with two decimals of a per cent and `0.00%`,
  instead of the text `45%`. The measurements sheet rounds its numbers the same way.
- `false`, `0` and `''` are values; `getObjectValue`, which falls back on every falsy value, is no
  longer used by the export (it is unchanged elsewhere).
- ` | ` is parsed only in `user` columns, as `UserColumn` does; `;#` only in a value that starts with
  a lookup id (`3;#Name`, `-1;#Term|guid`, every name of a multi-lookup), since no lookup data type
  exists.
- File names keep `æøå`: only `\ / : * ? " < > |` and line breaks in the name and the view's name
  become dashes (the timestamp is unchanged).
- The measurements JSON gets the measurement's `Date` (both data adapters), and the sheet uses it
  instead of parsing `DateDisplay` (`toLocaleDateString()`) back with `new Date()`.
- **Found while fixing, also fixed:** dates were written as the UTC day (`toISOString().slice(0, 10)`),
  so a date-only value (local midnight, sent as UTC) exported a day early east of UTC, and times
  were in UTC; they are now the browser's day and time, as the list shows them. And the service is
  one instance per page that each web part configured as it rendered, so with two of them on a page
  an export could take the other's name and measurements configuration; each export now configures
  it as it runs.
- A failed export shows a toast (`Toaster` in the shared `Fluent` wrapper, its id in the web part's
  context next to `layerHostId`), and the dynamic list's selection text has a singular and a plural
  string instead of `valgt{1} element{2}`.
- Tests, each seen failing on the old code first: the service's file 18 → 23 (dates are built from
  local time, since Jest gives each test a copy of `process.env` and the time zone cannot be set per
  file), and new files for the three export hooks (6, 5 and 7 tests) that render a real `Toaster`.

**Reducers** (the faults 2a's tests pinned; each pinning test now asserts the fix and was seen
failing first):
- ProjectStatus: a failed delete sends its error and shows it as the non-blocking `userMessage`
  (with a title, cleared after 8 s as a failed publish is), not `state.error`, which replaced the page.
- ProgramAdministration: a failed removal resets `isDeleting` and shows an error toast.
- PortfolioAggregation: `TOGGLE_COMPACT` sets the mode from its payload; `isSortedDescending` means
  what it says everywhere (the helpers take *ascending*; the crossed `SortDescLabel`/`SortAscLabel`
  names are commented, not renamed); the fetch sets the view's grouping with a new
  `SET_VIEW_GROUP_BY` instead of toggling it (proved real by a test that runs the fetch on the real
  reducer: two views grouped on the same column, the second came out ungrouped); `viewId` read from
  `location.search`; `COLUMN_DELETED` also leaves `allColumnsForCategory`; `DATA_FETCH_ERROR` ends
  `loading` (no visible change: `List` drops the grid on an error).
- PortfolioOverview: `DATA_FETCHED` writes the new grouping to the address; and the same sort flag
  inversion as the aggregation, found by the reducer agent and fixed by the main session: the menu,
  `SET_SORT` and the grouping sort now agree with `ListGrid`'s arrow. Without a direction (the
  custom sort's menu item), an unsorted column sorts ascending and a sorted one flips, which is
  what users saw before.
- ProjectInformation: `UPDATE_DATA` builds the properties from `current(state)`.

**Templates and upgrade.**
- `UpgradeAllSitesToLatest.ps1` finds the project properties list by its title in the
  installation's language (`Lists_ProjectProperties_Title`).
- `Prosjektkolonnekonfigurasjon`'s three `GtStatusOpportunities` rows looked up id 54 since 1.8.0
  (the column is row 36); fixed in the template, and `PostInstall.ps1` adds the three rows on
  existing hubs by looking the column up by `GtInternalName` (the old rows stay).
- `channels/kurs.json` lists `DynamicListWebPart` under `ProjectWebParts` with an id of its own.
- No harness tests PowerShell or templates, so these three have no automated test.

**Packaging, CI and accessibility.**
- `shared-library`'s loc test moved out of `src/loc`: every file there is packaged as a locale, so
  each `.sppkg` carried `SharedLibraryStrings_strings.test.js`.
- `generate-sbom.yml` uploads the artifact on a tag and commits only on a branch, when more than the
  timestamp changed, with a plain `git push` instead of an unpinned third-party action.
- `sync-version` reads the projects from `rush.json`, covering all 11, with `--dry-run`.
- `@BaseDialog`'s close button is named «Lukk»; `IBasePanelProps.hidden` describes what it does.

**The guide.** `maler/*.md`, `utgivelse/opprette-ny-versjon.md` and `utgivelse/npm.md` rewritten
against the repository; `npm.md` is proposed folded into `versjonering.md`.

**Result.** tsc clean and every suite green in the five projects 2b touched: shared-library 399,
PortfolioWebParts 179, ProjectWebParts 189, ProjectExtensions 118, ProgramWebParts 37 (922 tests).
Every coverage floor holds; ProjectWebParts' functions fell to exactly its floor (50.00) because
the export test loads `listOperationUtils`, so that file got tests of its own (9) and stands at
51.26.

**Found and left:** the Norwegian names in older upgrade steps (version-gated before English
existed, except on a hub whose log has one install entry); the three old `GtStatusOpportunities`
rows on existing hubs; `$schema.json` lacking two extensions; `generate-sbom.js` covering 8 of 11
projects; a guard against tests in `src/loc`; removing sub-areas is not all-or-nothing (the
program drops them before the hubs are updated); `en-us.js` in ProjectWebParts has a
`DeleteReportButtonText` the typings do not declare; text columns' numeric coercion (`00123` exports as
`123`, as before); and the stale chapters the guide agent listed (`versjonering.md`,
`bygge-utgivelse.md`, `npm-skript.md`, `kontinuerlig-integrasjon.md`, `sbom.md`,
`branching-og-arbeidsflyt.md`, `kom-i-gang.md`'s `[apps-only:…]` example).

### Found in 2a's hand check: the change-phase dialog (2026-10-06)

The user's hand check of 2a on the test tenant found two faults in `Fasevelger`, both already in
1.14 (`main` has the same wiring, read through the GitHub API), so neither is from Redux Toolkit 2:
"Hopp over alle" and `Avbryt` left the dialog on the confirmation the next time it opened, for any
phase; and changing phase by skipping one or going back showed another phase's checkpoints. The
cause of both: `ChangePhaseDialog` stayed mounted from the moment the data loaded and got `INIT`
once, in a mount effect, so every opening reused the state of the first, including the checklist
of the phase the project was in when the page loaded.

The fix: the dialog mounts only while a phase waits for confirmation, and its state starts from
`INIT` through `useReducer`'s initialiser (no effect, no frame of old state), as a new object.
Since the checklist is now read afresh from the loaded phases each time, a checkpoint saved in the
dialog is also written back to them (`CHECKLIST_ITEM_SAVED` in the phases reducer, which copies
the changed phase, as immer does not draft the class, and counts the statuses again for the
popover); otherwise a checkpoint answered before a cancel would show as open again. The dialog's
state holds a copy of the checklist, as immer freezes what a state holds. Tests: the web part's
test opens, skips, cancels and reopens for another phase (failed before), and answers, cancels and
reopens (guards the write-back); the phases reducer's test covers the write-back.


### Between slices: two runs on the test hub at once (2026-10-06)

2b's batch (full run, `48295bc`) and the change-phase fix (`[apps-only]`, `e9d27b6`) were pushed
15 minutes apart, and both runs deployed to the test hub at the same time: the full run uploaded
its packages at 11:51 and applied the templates until 12:13, the packages-only run uploaded its
packages at 12:05. Nothing was lost, by luck: the later packages were the newer build, which holds
every commit. The packages-only run's e2e failed on one test, and not because of the overlap:
`@BaseDialog`'s X has been named «Lukk» since 2b, so `document-template-copy.spec.ts` found two
buttons by that name. The spec now finds the summary's button by its text (`.last()` would have
passed at once on the X, which is always there, before the copy ended).

`ci-channel-test.yml` now has one `concurrency` group for every branch (`ci-channel-test`,
`cancel-in-progress: false`), at the workflow level: a run waits while another runs. Job-level
groups were not used, since GitHub cancels an older waiting job when a newer one queues, which
across two runs would cancel one run's e2e or the other's upgrade. The limit that stays: GitHub
keeps one waiting run per group, so a waiting full run is cancelled by a newer push, and its
templates are not applied; the release skill and the CI chapter say to push that commit last.

### Slice 3 — React 18 readiness (2026-10-06)

npm on the day decided most of the slice (P5-11): SPFx 1.24 is still `1.24.0-rc.0`;
`@hello-pangea/dnd` 18 and 17 require React 18, 16.6 declares 16.8, 17 and 18;
`react-calendar-timeline`'s current line is a beta that requires React 18.

- **Dependencies.** `react-beautiful-dnd` ~13.1.1 (and its types) became `@hello-pangea/dnd`
  ~16.6.0, an import rename in the three files of the show/hide columns panel; it brings
  react-redux 8 with redux 4, both fine on React 18. `react-autocomplete` (and its types),
  `react-image-fade-in`, `react-scroll` and `react-fade-in` were declared and imported nowhere, and
  are removed. `rush update` now lists two React peers: `create-react-context` under the timeline
  (P5-11) and `use-image-color` (0.0.9, `react ^16.8`, unchanged since 2022), a plain hook kept and
  tried on React 18 in slice 4.
- **One place mounts React.** `renderReact` and `unmountReact` (`shared-library/src/util/reactRoot.ts`)
  wrap react-dom's `render` and `unmountComponentAtNode`; all 15 render sites use them (a script
  changed the calls and imports; a whitespace-blind diff showed only those, apart from the three base
  web parts' `abstract render()`, which it also renamed and which went back by hand). react-dom's
  `render` is now imported in that one file. Slice 4 keeps a root per container there. Of the
  seven sites without an unmount of their own, four use their base web part's `onDispose` and two
  dialogs call it through `ReactDOM.*`; the footer had none.
- **Found and fixed:** the footer rendered into a new `div` on every navigation and dropped the old
  one without unmounting it, so each page visited left a mounted footer running; and its placeholder's
  `onDispose` was passed unbound and called `dispose()` on the placeholder being disposed. It now
  renders into one element, unmounts it when SharePoint disposes the placeholder, and makes a new
  one on the next navigation. And the project list's card header called `useImageColor` only with
  dynamic colours on, a project loaded and no logo of its own, so turning dynamic colours on in the
  property pane threw "Rendered more hooks than during the previous render"; the hook now runs on
  every render, with an empty source when the colours are not wanted.
- **Tests,** first on the old code: the footer's mounted count after three navigations (3, now 1,
  and 0 after the placeholder's dispose); the card header (failed with the hooks error); the panel's
  drop handler (a drag cannot run under jsdom, every element measuring zero), green on both
  libraries; the helper's own tests.
- **Result:** tsc clean and every suite green in all six projects: shared-library 401,
  PortfolioExtensions 101, PortfolioWebParts 183, ProjectWebParts 192, ProjectExtensions 118,
  ProgramWebParts 37 (1032 tests); every floor holds. The `pp365-ui` skill and `kodemonster.md`
  (a new section, «Montering av React») say to mount through the helper.

### Between slices: Windows and macOS (2026-10-07)

Tarjei's `d440e8c` (branch `fix/windows-local-build`, off the same `bba23bc05`) fixed four faults
that only a Windows build met: lint failing every line on CRLF checkouts (`endOfLine: auto`),
`npm install` in `Templates` breaking Rush's links in `Build-Release.ps1`, the Jest transform key
for the AMD loc bundles matching `/` only (Jest converts the `*IgnorePatterns` to the platform
separator, not `transform`'s keys), and the timeline test comparing a currency in the machine's
locale. The four changes are taken in word for word, so a later merge of the two branches meets
the same lines (the changelog line apart).

A read-only audit of the rest (Node scripts, npm and Rush scripts, Jest and Heft config, Prettier,
tests, PowerShell, watch and debug, Rush and pnpm) found nothing else that stops a build, lint or
test on Windows, and these, fixed here:
- `generate-channel-config <channel> /update`: Git Bash rewrites `/update` into a Windows path, so
  the flag was missed and an installed channel would get new ids. The flag is now matched as the
  last path segment, or `--update`.
- `SharePointFramework/.tasks/build.js` ran `node <absolute path>` through a shell with the
  arguments unquoted, so a repo path with a space broke the channel builds (proved with a path in a
  folder named `a b`); arguments with whitespace are quoted.
- `Build-Release.ps1`: native output is read as UTF-8 (Windows' console code page garbled the logs);
  a local build installs the root's own packages when they are missing (only CI ran `npm ci` there,
  so `generate-channel-replace-map` and `generate-site-scripts` failed silently on a fresh clone,
  and both now stop the build when they fail); `-Force` used `rimraf`, which is not installed.
- `generate-sbom.js` sorts with English collation (nb-NO sorts `aa` as `å`, after `z`).
- The tracked `Templates/Content/**/*-validation.md` held the machine's local time and its absolute
  path (`/Users/…` from the last run); they now hold neither, so they only change with the template.
- The solutions' `.vscode/settings.json` gave `typescript.tsdk` as a Windows-only `.\\…` path.
- `.gitattributes`: `* text=auto eol=lf`, `-text` for the vendored, signed PnP.PowerShell module,
  binaries marked. 17 files are stored with CRLF today and are renormalised once.
- Docs: the one-test-file command in cmd.exe (double quotes), `NODE_OPTIONS` in PowerShell and cmd,
  the e2e README's `VAR=value` prefixes replaced by the `.env` files, `Build-Release.ps1`'s case in
  `npm-skript.md`, and a «Windows og macOS» section in `utviklingsmiljo.md` (terminal, nvm-windows,
  line endings, long paths, variables).

### Before slice 4: a React 18 spike, and what it asked for on React 17 (2026-10-07)

An agent ran React 18 in a copy of the repository, nothing committed: `react`/`react-dom` 18.3.1,
`@types/react` 18.3.31, `@types/react-dom` 18.3.7, Testing Library 16.3.3 with `@testing-library/dom`
10.4.2, SPFx left at 1.23.2, and `renderReact` on `createRoot` (a root per container). The result:
- **Types:** 22 errors. 18 from five props types that read `children` without declaring it
  (`FC` no longer adds it): `IFluentProps`, `IColumnDataTypeFieldProps`,
  `IPlannerTaskItemPropertyProps`, `MigrateRiskActionsDialog` and `HelpContentDialog`. 4 from the
  narrower `ReactNode`: two `{value}` of type `unknown` (a cast keeps today's output), the dynamic
  list's error (a string at run time, typed `CustomError`), and `ProjectPhases`' toast.
- **Tests:** 17 of 1032 failed, in two files, for one reason: `createRoot` renders after the call
  returns, so the footer test and the helper's own test assert before the render. `act` fixes both.
  No act warnings turned errors, no batching changes, no Testing Library 16 API breaks, no Fluent or
  Tabster failures. React 18.3 warns about `defaultProps` on function components (47 files): clean-up
  before React 19, not 18.
- **Toolchain, for slice 4:** the PnP controls take React 17.0.1 as a dependency, so on React 18
  pnpm gives them their own copies of Fluent v8 and v9, which would be bundled twice; overrides
  (`@pnp/spfx-controls-react>react`, `>react-dom`, the same for `@pnp/spfx-property-controls`, to
  18.3.1) make them share ours. `react-dom/client` is not an SPFx external (only `react` and
  `react-dom` by exact name), so webpack bundles its few lines, whose `require('react-dom')` stays
  external: it works only if SharePoint serves react-dom 18, which the tenant shows.

Done here, on React 17: the five `children` declarations, the casts, the dynamic list's error typed
`string`, and `act` in the two tests. And `ProjectPhases`: it dispatched the error toast during
render, on every render while the error was set, to a `Toaster` id no `Toaster` was mounted with,
so a failed phase fetch or change was never shown. The toast now comes from an effect, once per
error, into a mounted `Toaster` (a test that failed before). The 13 files, copied into the spike's
copy, leave no TypeScript error on React 18's types.

### Slice 4, step 1 — SPFx 1.24.0-rc.0, still on React 17 (2026-10-07)

1.24 GA is not out (npm `latest` 1.23.2, `next` 1.24.0-rc.0), so the step runs on the RC (P5-4).
CLI for Microsoft 365 has no rules for the RC (`latest` and `next` both refuse `--toVersion
1.24.0-rc.0`), so the change set was read from Microsoft's own generator instead: the
`@microsoft/generator-sharepoint` packages for 1.23.2 and 1.24.0-rc.0, diffed. For a project like
ours it holds: every `@microsoft/*` package 1.23.2 to 1.24.0-rc.0 (the rig and the Heft plugins
included), `@rushstack/heft` 1.2.17 to 1.3.2, two security floors as npm `overrides` (`qs >=6.15.2`,
`uuid >=11.1.1`), `engines` widened to Node 22, 24 and 26 (we stay on 22, P5-5), and, for new
projects, React 18.3.1 with `@types/react` 18.2.79 and `@types/react-dom` 18.2.25 and a web part
template on `createRoot` (step 2). The rest is Copilot components, which we have none of.

Applied: 68 `@microsoft/*` pins in the six solutions, `.eslint-config` and `.jest-config`; Heft in
seven `package.json` files and the `globalOverrides`; `@rushstack/eslint-config` 4.6.4 to 4.8.0 (what
`@microsoft/eslint-config-spfx` 1.24.0-rc.0 uses); `qs ^6.15.2` and `uuid ^11.1.1` in
`globalOverrides`, held to their major because uuid 12 and later ship ESM only, and the tools that
require() it (the SPFx Heft plugins, jest-junit, sockjs) would then lean on Node's require(esm). The
rig moves its plugins (heft-jest-plugin 2.0.19, lint 1.3.1, Sass 1.5.0, webpack5 1.3.30) and keeps
ESLint 9.37.0 and its own TypeScript 5.3.3; ESLint 10 is still outside the SPFx and Rush Stack peer
ranges. The PnP controls keep `@microsoft/sp-core-library` 1.23.x as a dependency of their own, a
page external, so it is not bundled.

Result: `rush rebuild` green, all 11 operations (the six solutions with the usual lint warnings),
a fresh `.sppkg` for each; no `pp365-*` AMD external; the timeline's stylesheet global and the
shared-library CSS modules hashed; no Jest failure and no floor missed; the manifests still ask for
React 17.0.1. heft-jest-plugin 2.0.19 passes `--test-path-pattern` on as Jest 30's
`testPathPatterns`, so the one-file command works again; the docs and skills dropped the
`--test-path-ignore-patterns` workaround. Next: the release build in the debug workflow, then the
test channel, then step 2 (React 18). The changelog's technical bullet moves to 1.24 with GA.

On the test channel (run 37626808256, `[apps-only]`): the release build on Linux green, the
1.24.0-rc.0 packages deployed to the test hub, and the browser suite 32 of 32. SharePoint runs the
RC's packages on React 17 as it ran 1.23.2's.

A saved change never reached the page under `npm run watch` (found by hand after the run, the same
under 1.23.2: `updateServeConfigAsync` is unchanged). SPFx serves with `devServer.hot: true`, but
each bundle on a SharePoint page has its own webpack runtime, the hot update fails ("Cannot set
properties of undefined", "[HMR] Update failed: Loading hot update chunk ... failed") and
webpack/hot/dev-server does not reload on that path, so only F5 showed it. `spfx-customize-webpack.js`
(stage `MAX_SAFE_INTEGER`, after the serve plugin) now sets `hot: false`, `liveReload: true` in all
six solutions. Checked with a Playwright probe against a project home page: the client logs "App
updated. Reloading..." and the page reloads about six seconds after the save.

### Between slices: shared-library under watch (2026-10-07)

A library change used to take `rush rebuild -o pp365-shared-library` and F5. With a solution's
watch running, `npx heft build-watch` in `shared-library` carries a saved `.tsx` to `lib/` in about
1 s, the solution's webpack sees it (it follows the pnpm link to the real path, outside
`node_modules`) and the page reloads after about 17 s; a `.module.scss` change after about 20 s
(Playwright probe on a project home page). Strings do not follow: spfx-heft-plugins'
`LegacyExternals` reads each `localizedResources` file once per watch and caches it, so a
`loc/*.js` change, the library's or the solution's own, shows only after the solution's watch is
restarted. `shared-library` got `watch` (`heft build-watch --clean`); AGENTS.md, the guide
(`utviklingsmiljo.md`, `kom-i-gang.md`, `npm-skript.md`) and the `pp365-toolchain` and `pp365-ui`
skills describe the flow.


### Slice 4, step 2 — React 18 (2026-10-07)

Applied on 1.24.0-rc.0, in all six: `react` and `react-dom` 18.3.1, `@types/react` 18.2.79 and
`@types/react-dom` 18.2.25 (the 1.24 template's, in `globalOverrides` too), `@testing-library/react`
16.3.3 with `@testing-library/dom` 10.4.2. `renderReact` keeps a `createRoot` per container in a
`WeakMap` and drops it on the unmount; two tests came first and passed on React 17 (a render after
an unmount, two containers apart). Overrides hold the PnP controls' `react` and `react-dom` to
18.3.1, so their Fluent v8 (8.106.4) and v9 (9.74.8) resolve to the same React 18 variants as ours.
SPFx's own `sp-*` 1.24.0-rc.0 still depend on React 17.0.1 and pull React 17 variants of Fluent,
but they are page externals and never bundled. SPFx 1.24 maps `react-dom/client` to a component of
its own (`3cadd7f5-5449-49c4-a153-1beb8facd90a`, only for React 18 and later), so no React DOM is
bundled; the manifests ask the page for `react`, `react-dom` and `react-dom/client` 18.3.1.

Result, fast loop: no TypeScript error in the six on React 18's types; 1035 tests in 158 files
green. React 18 flagged four updates outside `act`, all in tests: the SPFx dialog stub closes, and
so unmounts, a microtask after the click, and the setup's error dialog renders a few microtasks
after the dismissal; the three tests now wait for those inside `act`. Left as they were: the
`defaultProps` warnings on function components (clean-up before React 19, not 18) and the warnings
React 17 gave as well (a null `textarea` value, unknown DOM props, an uncontrolled input turned
controlled). The code has no `StrictMode`, so there was nothing to find there. The combobox family no
longer loops under jsdom (a real `Combobox` and `TagPicker` opened and picked), but one opening
took 44 and 57 s on a loaded machine, so the stand-ins stay; the testing guide, the skills and the
stand-in say so. Peer warnings left by design: the PnP controls' inner packages (northstar, the old
theme provider, their `sp-*` 1.23), `use-image-color` (`react ^16.8`) and `create-react-context`
under the timeline (P5-6, P5-11).

Next: a full build, then CI on the test channel (`[apps-only]`), which shows whether SharePoint
serves React 18 to an RC build (P5-4), then the hand round: PnP's term field and property panes,
the timelines, drag and drop in `Vis eller skjul kolonner`, the project cards, the dialogs and the
footer.

### Between slices: the leftover list, part 1 (2026-10-08)

From 2b's "found and left": the stale guide chapters, checked against the workflows,
`Build-Release.ps1`, every `package.json` and GitHub. `versjonering.md`, `bygge-utgivelse.md` and
`branching-og-arbeidsflyt.md` rewritten (sync-version covers every Rush project; the release build's
switches, output and the checks only it makes; `releases/1.15`, the branch names in use, squash
merge with the tag in the merge subject). `kontinuerlig-integrasjon.md`: `[build-kurs]` added,
`[skip-main-ci]` and `[skip-test-ci]` described as they behave, `build-release.yml` reading the
whole message, the dev job's certificate sign-in and times, `[apps-only:…]` explained against the
bundling (listing `shared-library` ships nothing a page loads), and the dev branch's screenshot
removed. `sbom.md`: direct dependencies only, `npm run rush:update`, and an audit that sees the
solutions. `npm-skript.md`: the missing scripts and the three missing projects. Also
`kom-i-gang.md`'s `[apps-only:…]` example and branch names, `opprette-ny-versjon.md`'s
sync-version and SBOM lines, `testing.md`'s artifact retention and label, `commit-praksis.md`'s
`main` exception, and the `pp365-release` and `pp365-testing` skills. `generate-sbom.js` reads its
projects from `rush.json` (12 `package.json` files, was 8), and `SBOM.md` and the guide's README are
regenerated (the generator writes CR around its separators; stripped).

**Found:** `[skip-test-ci]` does nothing (the job's `if:` starts with `always() ||`);
`ci-channel-test.yml` asks for 14 days of artifact retention where the repository allows 7.
`node common/scripts/install-run-rush-pnpm.js audit --prod` reports 36 advisories (4 critical, 21
high, 13 moderate). Direct dependencies among them: `xmldom` 0.6.0 in shared-library (critical, so
in the bundles), `lodash`, `moment`, `glob`, `react-gauge-component` (through `compression`) and
`msgraph-helper` (through `node-fetch`); the rest come through the PnP controls and SPFx's own build
rig and Heft plugins. Still left from 2b's list: the Norwegian names in older upgrade steps, the old
`GtStatusOpportunities` rows on existing hubs, `$schema.json` lacking two extensions, a guard against
tests in `src/loc`, sub-area removal not being all-or-nothing, `DeleteReportButtonText` in
ProjectWebParts' `en-us.js` without a typing, and text columns' numeric coercion in the export.
