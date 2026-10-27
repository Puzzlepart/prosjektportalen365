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
- **What allows 26.** SPFx's check lists it, and no other package in the tree sets an upper bound
  below it: the only `engines` that exclude 26 are the SPFx 1.23.x copies the PnP controls and
  `eslint-config-spfx` carry, and those exclude 24 just the same (`<23.0.0`); without
  `engine-strict` they stop nothing, as the Node 24 build showed. Heft, Jest, Playwright and pnpm
  have no upper bound; Rush prints "has not been tested yet with Rush" for a major newer than it
  knows, a warning, not an error. On 2026-10-13 Node 26.11.1 (downloaded from nodejs.org, checksum
  verified) built the shared library in 13 s and ran its Jest and runtime-contract tests, built
  ProjectWebParts, ran the integration harness's offline tests (`module.registerHooks`, which 26
  keeps; it runtime-deprecates the older `module.register()`) and type-checked e2e, all green and
  without a deprecation warning. 26's removals (`_stream_*`, `http.Server.writeHeader`, DEP0182)
  touch nothing in the build. 26 is LTS from 2026-10-28, active until 2027-10-20, maintained to
  2029-04-30.
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

- **D1. Node 26 directly, 24 only as the fallback, one version, 22 dropped.** Node changes what
  builds, not what ships, so it needs no release of its own and no template. Nothing in a Node
  move depends on having been on 24 first: each move is the same twenty files and the same two CI
  proofs, so going through 24 buys a second move within a year (24 is in maintenance from
  2026-10-20, 26 is the active line until 2027-10-20) and no safety the debug build does not give.
  The order is: the debug build on 26.11.1; green, it is merged; red for a cause that is Node's,
  the same branch goes to 24.21.0 and 26 waits for the fix. One pinned version in every place (as
  for 22): a developer on 22 or 24 gets `rush`'s and `Build-Release.ps1`'s clear error and runs
  `nvm install` / `nvm use`. Done on `releases/1.15` before the GA swap, so the swap is proven on
  the Node CI will keep. The `.nvmrc` moves to 26's first LTS patch after 2026-10-28 when a
  dependency bump is next pushed anyway.
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
| 1 | Node 26 (24 the fallback) | — | `.nvmrc` ×7 = 26.11.1; `engines` ×6 and `rush.json` = `>=26.11.0 <27.0.0`; the guard in `Build-Release.ps1` = 26; `AGENTS.md`, `kom-i-gang.md`, `utviklingsmiljo.md`, `bygge-utgivelse.md`, the toolchain and release skills. First `rush install` + `rush rebuild` locally on 26; then a push with `[skip-ci] [build-debug]` (the full release build on 26, deploys nothing); then the merge with `[apps-only]` (packages, e2e, integration). Red for a cause that is Node's: the same files to 24.21.0 and `>=24.11.0 <25.0.0`, and the cause logged here | 1 day | Debug build and test-channel run green; no `Node 22` left outside changelogs and plans |
| 2 | `defaultProps` | — | Per solution, smallest first (PortfolioExtensions 1, ProjectExtensions 3, ProjectWebParts 11, PortfolioWebParts 12, shared-library 20), each a commit; D2's two shapes; the existing component tests guard each file, and a file without one gets a render test first; the lint rule last | 2–3 days | Zero `defaultProps` in `src`; the rule in `pp365-eslint-config` |
| 3 | Dates in the site's time zone | — | `getSiteTimeZone()` in the library from the page context (offset and daylight rules); `formatDate`/`formatShortDate` take the zone for date-only values; `DateColumn`, the Excel export's dates and the timeline's list follow; an integration case in `project-properties`' five-zone matrix reads a list value through search; changelog line (done 2026-10-13, see the log) | done | The overview shows the day the site shows in all five zones |
| 4 | Test gaps | the matrices need a page | The icon helpers (`getFluentIcon`, `resolveFluentIcon`, `getIconComponentWithFallback`) and `DataService.ts` in Jest; `Tidslinje.aspx` in the program smoke; a matrix page on the e2e project (the user adds it once), then a read-only smoke for both matrices (done 2026-10-14, see the log; the matrix page added with `add-matrix-page`) | done | `testoversikt.md` lists no "Ingen test" but by choice |
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

- Node 26 differs from 22 in little that the build touches (V8 14.6, npm 11, the removals listed
  in the inventory); the local proof covered the library, a consumer, the integration harness and
  e2e, and the debug build covers the rest (the five other consumers, the PnP templates, the
  packaging proofs) before anything deploys. Rush's "not tested yet" warning stays until a Rush
  release lists 26; it is noise, not a gate. A developer's forgotten `nvm install 26` is the
  likelier failure, and both gates say so.
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

The inventory above. The shared library was built and tested on Node 24.15.0 locally, then the
library, ProjectWebParts, the integration harness and e2e on Node 26.11.1, as the proofs behind D1;
the coverage floors of ProjectWebParts were raised (slice 0).

### Slice 1 — Node 26 (2026-10-13)

The twenty places moved to 26.11.1 / `>=26.11.0 <27.0.0`, the guard in `Build-Release.ps1` to 26,
and the docs, skills, changelog and release note with them. `rush install` under 26 installs Rush
again (`install-run` keeps one copy per Node version) and prints Rush's "not a Long-Term Support
release" warning, which goes away on 2026-10-28; the install itself is unchanged. Then
`rush build -o pp365-shared-library` found the one thing in the repo that 26 changes: V8 14.6
dropped `minimalDays` from `Intl.Locale`'s week info (the proposal removed it), so
`getDatePickerLocalization` fell back to the American week rule on Norwegian sites. That is not a
Node matter only: V8 14.6 is Chromium 146, so Chrome and Edge of 2026 already lacked it, and the
date picker's week numbers were wrong there since phase 5 added them. The rule now comes from
`minimalDays` where Intl still gives it and from CLDR's week data by region otherwise (a test that
stubs the week info failed on the old code; the suite is green on 22 and 26). The debug build on 26
was green (run 38429925360), with the same six packages and the same coverage as the Node 22 build.

The user asked whether any test looked at the week numbers themselves: none did, only at the rule
given to Fluent. Two now do. A Jest test renders Fluent's real picker with our localization and
reads the week column for January 2027 (53, then 1 from Monday 4 January by ISO 8601; 1, 2, 3 by
the American rule): with the old helper on Node 26 it read 1, with the new one 53. A read-only
browser flow (`e2e/tests/flows/date-picker-weeks.spec.ts`) opens `Rediger prosjektinformasjon`,
types 15.01.2027 into the first date field, opens the calendar and reads the same column; against
the deployed build in Playwright's Chromium 153 it read 1, 2, 3, 4, 5, the bug in a real browser,
and it passes once this branch is deployed. January 2027 is the month to look at: 1 January is a
Friday, so the rules disagree there and agree for all of 2026.

### Slice 2 — `defaultProps` (2026-10-13)

The 47 `X.defaultProps` became a `const X_DEFAULT_PROPS: Partial<IXProps>` above each component,
merged at the top with `withDefaults(incomingProps, X_DEFAULT_PROPS)`, a small helper in the
library's `util` (four tests) that applies a default for `undefined` only, as React did. The
inventory's "eight files pass the props object on" undercounted: nearly all 47 do, to a hook, a
context or a spread, so the one shape serves all of them and the diff per file is two lines plus
the moved block. A script did 45 of them; `CurrencyColumn` (an expression body) and
`StatusReportColumn` (a multi-line signature) were done by hand. Ten defaults are read elsewhere,
by a web part's property pane (`min`/`max` of a row limit, `{...X.defaultProps, ...this.properties}`),
by two tests and by `StatusReportColumn`'s `fetchData`: those constants are exported, with the
component's name in the constant so the barrels never collide. One latent fault went with it:
`fetchData` merged the column's settings into `StatusReportColumn.defaultProps` with `_.merge`,
which writes into its first argument, so every fetch changed the shared defaults; it merges into a
fresh object now. `no-restricted-syntax` in `pp365-eslint-config` stops `defaultProps` from coming
back, and `kodemonster.md` and the `pp365-ui` skill describe the pattern. Every solution's suite was
run on Node 26 after the change.

### Slice 3 — Dates in the site's time zone (2026-10-13)

The library now formats an instant in the site's time zone, as SharePoint's own lists do.
`util/pageContext.ts` keeps what SPFx hands over (`rememberPageContext`, called from
`createSpfiInstance`, which every web part and extension goes through before it renders): the
cultures and `legacyPageContext.webTimeZoneData`, SharePoint's own time zone record with its
Windows transition rules (`Bias`, `DaylightBias`, `DaylightDate`/`StandardDate` as `SYSTEMTIME`
rules, `Day` 5 for the last occurrence). Modern pages have no `_spPageContextInfo` on `window`
(checked on the test hub), so the global stays as the fallback for classic pages and the
integration harness only. `util/siteTimeZone.ts` applies the rules (`siteOffsetMinutes`, checked
for Oslo, New York, Tokyo, Sydney's year-spanning daylight time and a March with four Sundays) and
`toSiteWallTime` gives a `Date` whose local fields hold the site's wall time, so `toLocaleString`
without a zone shows what SharePoint shows; without a site zone the instant is left alone, and the
machine's zone decides as before. `formatDate`, `formatShortDate` and `getDateForExcelExport` go
through it, so `DateColumn`, the status report's project information, the timeline list, the news
and report dates and the Excel export follow. A date picker's value is a day at local midnight, not
an instant: moved to the site's zone it would read as the day before east of the site, so the new
`formatDay` writes it (the picker's `formatDate`, and the two displays of a parsed day in
`ProjectInformation` and the idea module), with `parseShortDate` as its pair.

Three findings along the way. The hub's page context carries the zone with its rules while the REST
API (`web/RegionalSettings/TimeZone`) gives only the offsets, so the integration harness builds the
rules itself for the European zones (`siteTimeZoneData` in `integration/src/context.ts`) and the
site-day test skips elsewhere. Jest cannot move the machine's time zone: `process.env.TZ` inside a
test writes to Jest's copy of the environment, and the first version of the tests passed on an
Oslo machine for the wrong reason; real Node applies it at once, so the five-zone matrix runs in
`test/runtime/dates.runtime.test.mjs` (`node --test`, in the library's build) and in
`project-properties`, while the Jest tests vary the site's zone instead (Honolulu lies west of any
machine the suite runs on). And the hub's portfolio views show no date column, so the browser proof
is on the status page: `e2e/tests/flows/dates-site-time-zone.spec.ts` runs the browser in Los
Angeles and compares the report selector, the report menu and the date-only fields of the project
information sections with SharePoint's own texts; against the deployed build it reads a report
published at 14:08 as 05:08, which is the bug, and passes once this branch is deployed.

Suites after the change, on Node 26: shared-library 486 (76.93 / 82.91 / 59.34 / 76.93), runtime
6, ProjectWebParts 239, PortfolioWebParts 200, all above their floors; the three type checks and
the integration harness compile. Changelog and release note carry the fix; `pp365-ui` and
`pp365-testing` the rules.

### Slice 4 — Test gaps (2026-10-14)

The three untested library modules have Jest tests now. `icons/index.test.tsx` (17) covers the
one lookup every icon goes through: a catalog name, a UI Fabric alias (each of the 17 aliases
resolves to a catalog entry, `CircleFill` to the filled variant), a key from `Object.prototype`
(list data can hold any text), colour, size and class on the element, the cached bundled component
and the cached UI Fabric wrapper (the same identity each time, so React never remounts an icon),
the UI Fabric fallback with the size as the font size, and the older boolean form. jsdom reports a
computed colour as `rgb()`, which the first run showed. `services/DataService.test.ts` (3) opens the
base's protected hooks through a subclass and checks the form-visibility flags read from a field's
schema XML. `services/DataSourceService/index.test.ts` (5) runs the service against a structural
web whose two lists answer from canned rows and record the titles, selects and filters asked for:
the lists are found by the strings' titles, a data source by id or title comes with its columns,
refiners and grouping picked among the content columns, no match and a failed fetch both give
`null` (the failure only logged), and a category query adds the level to the filter.

The program's second timeline page was the real gap: the template names them
`ProgramTidslinje.aspx` (the program's own timeline) and `Tidslinje.aspx` (titled "Programtidslinje",
ProjectWebParts' timeline with the program's items), and the smoke opened only the first. A test
opens the second and waits for the drawn timeline. No template page holds the matrix web parts, so
`tests/smoke/matrices.spec.ts` checks two places: the status page's uncertainty section, which
draws the selected report's matrix when it has risks or opportunities, and a page with both web
parts (`E2E_PAGE_MATRIX`, else `Usikkerhet.aspx` and a few more names), skipping with the reason
until it exists. `integration/scripts/add-matrix-page.ts` (`npm run add-matrix-page -- <url>`)
adds that page through PnPjs 4's client-side page API, signed in as the harness is: an article
page, one section per web part, each from the site's component definition with the toolbox's
defaults (the manifest's first preconfigured entry), published; it did so on the e2e project on
2026-10-14. Two things it taught. `GetClientSideWebParts` writes component ids in braces and upper
case (`{B1500CBA-…}`), so an id compared as the channel files write it never matched, and the
script's first version fell back on the manifest alias and picked a risk matrix from a 1.8.1
package the tenant's app catalog still holds (seven risk matrices from 1.8.1 on are offered); the
page rendered that package's code, and the opportunity matrix of the same package did not render
at all. The script normalizes the ids, accepts only the channel's own and lists the other packages
when the channel's is missing, and `--replace` recycles a page to remake it. The suite's channel
guard (`expectReleaseChannel`) had let that page through, since no channel file knew the id: it
now also fails on a PP365 web part (by the alias in its feature tag) whose id no channel file
knows. A drawn matrix is at least nine cells with a size. The page is a single web part app page, where SharePoint sets no feature tag, so the web
part is found by the title it renders (the first local run looked for the tag).

The flaky tabs flow in `navigation.spec.ts` (runs 37107937758, 38429925362 and 38516321658,
passing on retry each time) found a tab's section by its title, as the last text on the page with
that name; the report of run 38516321658 showed it picking a status field's label of the same name
("Overordnet status") lower on the page, out of view once the page had scrolled. A tab scrolls to
the element whose id is the section's id behind the language's prefix (`seksjon12`), and the tab
is a button whose `value` attribute is that id (Fluent's `data-overflow-item` is an empty marker,
and the tab's text is rendered twice, "FremdriftFremdrift"), so the flow reads the id and finds
the section element; it takes only the tabs that fit (the overflow menu's own tab has the value
`overflow-menu`) and waits for the page's height to stand still as well as the last section,
1.5 s at a time, within 45 s, since a list section that finished loading between two looks still
moved it.

The slice 3 push (run 38516321658) deployed to the test channel: the Los Angeles flow passed in
CI against the deployed build, and the integration suite had one failure, the older
`project-properties` case that typed a picker's day with `formatShortDate`, which now moves an
instant to the site's zone (a Helsinki midnight is the evening before in Oslo). It types with
`formatDay`, as the picker does, and passes against the tenant; the harness' site-zone context was
what made CI show it.

The test overview's "Ingen test" bullet is gone; what remains uncovered is there by choice (the
program aggregation has integration tests and no browser test).

### Before the merge (2026-10-14)

Four loose ends from slice 4, done before the PR. The `custom-cells.txt` 404 seen on the first
matrix page was not ours: no code in the repo names the file, the request used
`getFileByServerRelativeUrl`, which PnPjs 4 does not have, and it came from the 1.8.1 package's
web parts that page first held. Today's matrix web parts load with no 4xx and no console error,
and the 44 browser-error attachments of CI run 38522211703 hold no 4xx either; the hardened
channel guard now catches such a page.

The two tests that skipped on every run had the data they needed; they looked too early. The
portfolio overview's title button test counted the buttons at the first cell, which is a
placeholder row ("Viser 0 av 0"); even after the rows arrive the title cells are plain links for a
few seconds, until the view's own columns replace the ones persisted in local storage. It now
waits for the results counter and the first button, and passes against the hub's 42 projects.
The program administration's add dialog lists the hub's 197 other projects in two groups of ten
or more, which the dialog opens only on request, so the list was two rows high and never
scrolled; the test opens them with `Vis alle grupper`, as a user would, and passes. Every
navigation outside `openPage` (the library views of both document template specs, the quick
launch's pages, the sign-in, the local bundle) goes through `withNetworkRetry`, which retries a
network-level failure such as `net::ERR_TIMED_OUT` once; `deployment.setup.ts` keeps its own
loop. The full suite ran locally with 53 passed and none skipped. The one flaky test of the
last CI run (38526548748, green otherwise) had the same cause: the list typography test measured
the overview's placeholder rows after a fixed two-second pause, found no text and so no font size;
`measureListTypography` now waits for text in a cell first, and passed twelve times with CI's two
workers. With the default workers and `--repeat-each=3` the same pages failed in the web parts
themselves ("Ingen konfigurasjon tilgjengelig", "Det har oppstått en feil"): twelve heavy pages at
once are more than the tenant answers, not a fault of the change.

PortfolioWebParts had 0.5 points over its branch floor. Forty characterization tests (they pin
what the code does, so they passed at once) cover the project list's tab filters
(`ProjectListFilterRegistry`, with its `$ne`/`$in`/`$nin` operators and state and access gates),
the list view's columns (`useColumns`), the portfolio and view selectors, `applyActiveFilters` and
the group names of persons, terms and lookups. Branch coverage went from 72.50 to 77.58 (1 371 of
1 767: the files the new tests load add their own branches to the total); statements 63.65,
functions 52.31. By the house rule the floors follow, a point under the rounded-down figure:
PortfolioWebParts 62 / 76 / 51 / 62 (was 62 / 72 / 49 / 62), and shared-library, grown by slices
3 and 4, 76 / 82 / 60 / 76 from CI's 77.75 / 83.02 / 61.03 / 77.75 (was 75 / 81 / 57 / 75). The
other four solutions are within the formula of their floors.

### CI workflows (2026-10-14)

A review of every workflow against what the test channel's had learned, committed straight to
`releases/1.15` at the user's request. All workflows now read tags from the subject only (`main`
read the whole message, so one tag anywhere in a release's squash body counted), every job has a
timeout (GitHub's default is six hours, and the test channel's runs wait for each other), the
GITHUB_TOKEN is read-only except for the SBOM commit, a failed build uploads the whole Rush logs,
and the deployments read the certificate as `$env:` instead of having it written into the step's
script. `ci-releases.yml` got the test channel's lessons: a `concurrency` group for the dev hub,
`[skip-upgrade]` on its packages-only upgrade, `-RushTimeline -SkipPnPPowerShell` there, and the
run number in the package versions through `-Channel main`. That last one hid a trap: a channel
build set `hiddenFromToolbox` on every web part, so `-Channel main` would have hidden the main
channel's web parts across the tenant's app catalog; `modifySolutionFiles.js` now hides them only
when the channel's ids differ from the manifests' own (`.tasks/modify-solution-files.test.js`,
seen failing first). The fresh installation (`sites/pp365_<sha>`, 354 of them on the tenant, none
ever deleted) runs only with `[fresh-install]`. `ci-build-debug.yml` builds every pull request to a
release branch as «Build release package (pull request)», the check the branch protection is to
require instead of «Rush Install and Rebuild», which came from a workflow in `unused/` that never
ran; the job has its own name on a pull request because a push without `[build-debug]` reports a
skipped job on the same commit, and a skipped job passes a required check. `unused/` is deleted, the actions
moved from v4 to their Node 24 majors (checkout, setup-node and upload-artifact v7,
download-artifact v8; none of the breaking changes touches how they are used here), and
PnP.PowerShell installs through `Install-ModuleWithRetry` after a PowerShell Gallery outage failed
run 38522211703. The user removes the stale secrets and `SP_URL_ENG`, and changes the branch
protection.

The same day, after commit ef261f553: `ci-releases.yml`'s build failed (run 38545996195) because
`Build-Release.ps1`'s `-Channel` did not accept `main`; it does now. Checking that path found an
older trap: the `.env` template sets `SERVE_CHANNEL=main`, and `modifySolutionFiles.js` did nothing
on `main` even with `--force`, so a local `Build-Release.ps1 -Channel test` packaged every solution
whose `.env` said `main` with the main channel's ids, silently (the script's output is discarded).
CI has no `.env` and was not hit. `--force` now swaps whatever `SERVE_CHANNEL` says
(`.tasks/modify-solution-files.test.js`, seen failing first), and the release script stops when a
solution lacks the channel's solution id after the swap, or, with `PP365_BUILD_NUMBER`, the run
number. Two corrections to the review: `NODE_VERSION` is not stale, since `main`'s and
`releases/1.14`'s workflows read it (`16.18.0`), so it stays until 1.15.0 is on `main`; and GitHub
names a skipped job by its unevaluated `name:` expression, which the branch protection's list
offered and which was picked, a check no pull request reports. The rule for `releases/1.15` is to
require «Build release package (pull request)», in a rule for that exact name, since the branches
up to 1.14 that `releases/1.1*` also covers run no workflow on a pull request.

### After the merge of #1793 — the data across hubs (2026-10-22)

What the review of the test gaps found in the two places the solution reads from several hubs,
with the user's choice to fix all three and cover them.

- **The program administration without `AvailableProgramHubs`.** The hubs came from the global
  setting alone: a row emptied or disabled left `programHubs` undefined, the list empty and the
  add dialog empty, with no word of why, although `GtChildProjects` held projects. The template
  seeds the hub's own URL and `PostInstallUpgrade.ps1` keeps the row, so only an administrator's
  hand got there. The hook falls back to the program's own hub (`portalDataService.url`);
  `useProgramAdministration.test.tsx` covers the setting read, the fallback and a hub that cannot
  be resolved.
- **The merged view.** `fetchMergedViewData` swallowed a hub that failed with `console.error` and
  showed the list without it, and reused one adapter for every other portfolio, whose `configure`
  returns the first hub it was given: from the third portfolio on, the rows were the second's
  under the third's name. The fetch is now `data/mergedViewData.ts`, pure and tested (the
  `DepartmentId` swap, the merge with hub metadata and the dedupe, the orchestration with a
  failing hub); the adapter makes a fresh `DataAdapter` per portfolio and names the hubs that
  failed in `failedPortfolios`, which the reducer keeps as `mergedViewFailures` and the overview
  tells above the list in a warning (`MergedViewHubFailedTitle`/`Text`). No test imports the
  adapter: its 34 untested methods would have pulled the functions floor down (pp365-testing).
- **Several hubs in integration and E2E.** The test program spans two hubs (the hub-group tests of
  `program-administration.spec.ts` ran, not skipped, in run 39615813511), yet neither suite knew a
  second hub. `INTEGRATION_SECOND_HUB_URL` (a repository variable, one of the hubs
  `AvailableProgramHubs` names) and `tests/multi-hub.test.ts`: the hubs the setting names resolve,
  a second hub is read as the merged view reads one (its own views and columns, its sites by
  `DepartmentId`), and one search finds sites in every hub as the program administration's does.
  `portfolio.spec.ts` chooses «Vis alle hubber» where the overview offers it and expects no hub
  told as unread, skipping with the reason where it does not.
- **Left:** `addChildProjects`' writes to another hub are covered only by the browser flow that
  adds a removed project back; the integration harness writes to the reserved project alone.
