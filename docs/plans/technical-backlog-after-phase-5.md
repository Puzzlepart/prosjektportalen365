# Technical backlog after phase 5: analysis and order

Status: proposed 2026-10-13, for the user's decisions (D1 to D3). Branch for the first slices:
`chore/node-24` off `releases/1.15`; the rest on topic branches as they come.

The items are what phase 5 (`dependency-upgrades-phase-5.md`) and the integration plan
(`integration-tests.md`) left for later, plus the gaps the test overview names. Each was checked
against the toolchain and npm on 2026-10-13 before it was placed; the inventory records what was
found, so a later reader can tell a fact from a guess.

## Goal and non-goals

Goal: every item either done, scheduled, or parked on a named blocker with a date to check again.
Nothing here changes what a user sees, except the date columns (slice 3) and the product item under
"Parked".

Non-goals: SPFx 1.24 GA itself (phase 5's P5-4 covers the swap), 1.15.0's close-out (phase 5,
slice 5), and anything that needs a template change before 1.15.0 (the templates are frozen for the
release).

## Inventory (2026-10-13)

- **Node.** The repo pins Node 22 in seven `.nvmrc` files (root and the six solutions), six
  `package.json` `engines` (`>=22.14.0 <23.0.0`), `rush.json`'s `nodeSupportedVersionRange`, the
  guard in `Install/Build-Release.ps1` (`-ne 22` stops the build), `AGENTS.md` (gotcha 4), four
  guide chapters and two skills. Every workflow reads `.nvmrc` (`node-version-file`), so CI has no
  version of its own. Node 22 leaves maintenance on 2027-04-30; Node 24 (Krypton) is in
  maintenance from 2026-10-20 and ends 2028-04-30; Node 26 becomes LTS on 2026-10-28. Latest 24 on
  2026-10-13: 24.21.0 (npm 11.19).
- **What allows 24.** SPFx 1.24.0-rc.0's own Node check (`sp-build-core-tasks`) lists
  `22.14.0 <23.0.0`, `24.0.0 <25.0.0` and `26.0.0 <27.0.0`; `sp-core-library` declares the same
  ranges. Heft 1.3.2 wants `>=20.9.0`, Playwright 1.63 and msal-node 7 `>=20`, pnpm 10 `>=18.12`,
  Jest 30 `>=18`. Rush 5.179 gates on `rush.json`'s range only; a newer Node than it knows gives a
  warning, not an error. No `engine-strict` is set. The shared library built and ran its Jest and
  runtime-contract tests under Node 24.15.0 locally on 2026-10-13 (Heft, TypeScript, webpack, Sass,
  Jest 30, `node --test`), with no new warning.
- **What allows 26.** Only SPFx, so far. Heft, Jest, Playwright and Rush have not declared it, and
  26 is not LTS until 2026-10-28: not this cycle.
- **`defaultProps` on function components.** 47 files: shared-library 20, PortfolioWebParts 12,
  ProjectWebParts 11, ProjectExtensions 3, PortfolioExtensions 1. React 18.3 warns in development
  builds only (SharePoint serves production React, so no user sees it); React 19 ignores them. Eight
  of the 47 pass the props object on (`context.props`, `{...props}`, `pick(props, …)`), so there the
  defaults must stay on the object, not in a destructuring: `ProjectStatus` reads
  `context.props.snapshotAttachmentFileName`, for example.
- **Date columns west of the site's time zone.** `DateColumn` renders `formatDate(value)` with the
  machine's time zone; a date-only field stored at the site's midnight (Oslo, `2026-10-05T22:00Z`)
  shows 5 October on a machine in London. SPFx's page context carries the site's zone
  (`pageContext.web.timeZoneInfo`: `offset`, `daylightOffset`, `daylightDate`, `standardDate`,
  `id`), and `_spPageContextInfo` has the same data on modern pages, which the library already reads
  through `globalThis` (`getUILocale`). The integration tests' time-zone matrix
  (`project-properties`, five zones) is the harness to prove it in.
- **`[apps-only:<solution>]`.** Already in `ci-channel-test.yml` ("Determine apps-only solutions"
  passes `-Solutions`), done in phase 5's leftovers. Dropped from the backlog.
- **`ListGrid` in the library.** `ProgramWebParts` imports eight modules from `PortfolioWebParts`'s
  `lib/` (the aggregation, the overview, models, data, `List/*`), so moving `ListGrid` alone
  removes no dependency. The library declares `sideEffects: false`, so an unused `ListGrid` in the
  barrel would be tree-shaken from the web parts that do not import it.
- **react-calendar-timeline.** `latest` is 0.30.0-beta.4 and `beta` 0.30.0-beta.19 (2026-07-24);
  no stable 0.30. Its peers: `dayjs`, `react ^18 || ^19`, `interactjs 1.10.27` (the library declares
  1.6.2 since phase 5). 0.28 runs on React 18 today (P5-11).
- **PnP controls.** `@pnp/spfx-controls-react` 3.25.0 and 3.26.0-beta build on SPFx 1.23.x with
  React 17; the 4.0.0 beta still pins `react >=17.0.1 <18.0.0`. No release declares React 18;
  ours run on it by P5-6, hand-tested in phase 5.
- **SPFx 1.24 GA.** npm `latest` 1.23.2, `next` 1.24.0-rc.0 (2026-10-02). Microsoft's.
- **Test gaps** (`testoversikt.md`): the icon helpers and `DataService.ts` have no tests; the
  matrices have no browser test (no template page holds one); the program's `Tidslinje.aspx` is
  opened by no browser test; several components have Jest only.
- **Coverage floors.** CI's last green build (run 38397766129) measured ProjectWebParts at
  52.02 / 73.83 / 57.07 / 52.02 against floors 49 / 71 / 54 / 49; the other five solutions are
  within a point of theirs. Raised to 50 / 72 / 56 / 50 on 2026-10-13 (rounded down, a point under
  the lower of CI's and the local run's numbers).

## Decisions (proposed)

- **D1. Node 24 now, one version, 22 dropped.** Node changes what builds, not what ships, so it
  needs no release of its own and no template. One pinned version in every place (as for 22):
  a developer on 22 gets `rush`'s and `Build-Release.ps1`'s clear error and runs `nvm use`. Done on
  `releases/1.15` before the GA swap, so the swap is proven on the Node CI will keep. 26 waits for
  Heft, Jest and Playwright to declare it; check again mid-2027, before 24 leaves maintenance.
- **D2. `defaultProps` go, in two shapes.** Where the component only reads its props: defaults in
  the parameter destructuring. Where the props object is passed on (the eight files): a module
  constant merged at the top, `const props = { ...DEFAULTS, ...incoming }`, so `context.props` and
  spreads keep seeing the defaults. A lint rule (`no-restricted-syntax` on
  `MemberExpression[property.name="defaultProps"]`) keeps them from coming back.
- **D3. What we wait for.** SPFx 1.24 GA (must). A PnP release whose peers allow React 18 (must;
  check monthly; until then P5-6 stands). A stable react-calendar-timeline 0.30 (should; check
  quarterly; if 2027 brings none, decide between pinning a beta and replacing the component).

## Slices and order

| # | Slice | Blocked by | Scope | Effort | Exit |
|---|---|---|---|---|---|
| 0 | Coverage floors | — | ProjectWebParts 50 / 72 / 56 / 50 (done 2026-10-13) | done | CI prints the new floors met |
| 1 | Node 24 | — | `.nvmrc` ×7 = 24.21.0; `engines` ×6 and `rush.json` = `>=24.11.0 <25.0.0`; the guard in `Build-Release.ps1` = 24; `AGENTS.md`, `kom-i-gang.md`, `utviklingsmiljo.md`, `bygge-utgivelse.md`, the toolchain and release skills. First `rush install` + `rush rebuild` locally on 24; then a push with `[skip-ci] [build-debug]` (the full release build on 24, deploys nothing); then the merge with `[apps-only]` (packages, e2e, integration) | 1 day | Debug build and test-channel run green on 24; no `Node 22` left outside changelogs and plans |
| 2 | `defaultProps` | — | Per solution, smallest first (PortfolioExtensions 1, ProjectExtensions 3, ProjectWebParts 11, PortfolioWebParts 12, shared-library 20), each a commit; D2's two shapes; the existing component tests guard each file, and a file without one gets a render test first; the lint rule last | 2–3 days | Zero `defaultProps` in `src`; the rule in `pp365-eslint-config` |
| 3 | Dates in the site's time zone | — | `getSiteTimeZone()` in the library from the page context (offset and daylight rules); `formatDate`/`formatShortDate` take the zone for date-only values; `DateColumn`, the Excel export's dates and the timeline's list follow; an integration case in `project-properties`' five-zone matrix reads a list value through search; changelog line | 1–2 days | The overview shows the day the site shows in all five zones |
| 4 | Test gaps | the matrices need a page | The icon helpers (`getFluentIcon`, `resolveFluentIcon`, `getIconComponentWithFallback`) and `DataService.ts` in Jest; `Tidslinje.aspx` in the program smoke; a matrix page on the e2e project (the user adds it once), then a read-only smoke for both matrices | 1 day | `testoversikt.md` lists no "Ingen test" but by choice |
| 5 | SPFx 1.24 GA | Microsoft | P5-4: a version bump through CI and a hand round | ½ day | 1.15.0 cut on GA |
| 6 | PnP controls on React 18 | PnP | A release whose peers allow React 18; then the bump, the term field and property panes by hand (P5-6) | ½ day | — |
| 7 | react-calendar-timeline 0.30 | the project | A stable release; `moment` → `dayjs` in the timeline's data and items, `interactjs` to its peer; the timeline's Jest (22) and smoke tests | 2 days | — |
| 8 | `ListGrid` to the library | a third consumer | Not before one exists (the dynamic list's table is the candidate); then `List/ListGrid`, its context and cell registry move with their tests | 2 days | — |

Slices 1 to 3 fit the wait for GA; 4 can go between them. 5 to 7 are external and ordered by how
hard they block: GA blocks the release, PnP blocks nothing today, the timeline blocks nothing.

### Parked (product decisions)

- **"Lagt til" in the program administration** (the user, 2026-10-09: after 1.15). The date is
  stored nowhere: either a column in the program's list or a field in `GtChildProjects`' JSON, so a
  template change and a full upgrade, which puts it in 1.16 at the earliest.

## Rules for the executing agent

- Read `AGENTS.md`, the `pp365-toolchain`, `pp365-testing` and `pp365-release` skills and this plan
  before the first edit. Dependency changes go in `package.json` plus `rush update`, never through
  npm or pnpm in a solution.
- Never run git; the developer commits from the batch's message. Code never goes with a bare
  `[skip-ci]` (the release skill): `[apps-only]`, or `[skip-ci] [build-debug]` for a build change.
- Tests first; a test that pins existing behaviour (slice 2) is seen green on the old code and
  green on the new, and says so in the commit.
- Each slice ends with its log entry below: what was done, what was found, what was left.

## Risks

- Node 24 differs from 22 in little that the build touches (npm 11, stricter deprecations); the
  debug build is where a difference shows, before anything deploys. A developer's forgotten
  `nvm use` is the likelier failure, and both gates say so.
- `defaultProps` to destructuring in a file that spreads `props` on silently drops a default; the
  eight files are listed above, and the per-file render tests are the net.
- A site's time zone rules from the page context are SharePoint's own (bias and transition dates),
  not IANA: the conversion must handle a zone without daylight time and a transition on the day
  itself. The five-zone matrix covers Oslo, Helsinki, London, Reykjavik and Los Angeles already.
- The external items can slip past 1.15.0 and must not hold it: P5-6 and P5-11 already say so.

## Definition of done

Slices 0 to 4 merged and green on the test channel; 5 to 7 either done or parked with their next
check date in this plan; the test overview and the guide say what the repo does.

## Slice log

### Fact-finding (2026-10-13)

The inventory above. The shared library was built and tested on Node 24.15.0 locally as the first
proof for slice 1; the coverage floors of ProjectWebParts were raised (slice 0).
