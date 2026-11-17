# The archive: tests, end to end and universal design, as the rest of PP365

Status: proposed 2026-11-16, for the user's decisions (D1 to D6; D3 taken 2026-11-17); slice 0
under way on `feat/archive` (the slice log). Branches: `feat/archive` (18 commits on `origin/main` 9ca538a0c,
tip 2fbf493c3) and `feat/archive-dashboard` (15 commits on top of it, tip 016ed0941), rebased and
pushed 2026-11-16 (`--force-with-lease` over the old tips bec84468b and 3f0485c97). Target: 1.16
(D1). The plan belongs on `feat/archive`; slices branch off it, or are committed on it, as the
user prefers.

## Goal and non-goals

Goal: the archive work gets the layers the rest of the portal has before it is merged. That is
manual archiving and the phase change's archive step (ProjectWebParts), the archive status in
Prosjektinformasjon, the hub's archive log, and the hub dashboard Arkivoversikt (PortfolioWebParts).
The layers: Jest unit and component tests with jest-axe in every build; integration tests of the
data layer against the test tenant; Playwright smoke, flows and axe scans after the test channel's
upgrade; the pp365-a11y audit with a hand round; its rows in `.development-guide/spfx/testoversikt.md`
and `tilgjengelighet.md`; and the coverage floors held.

Non-goals: the external flows that do the archiving from the log (Power Automate or Logic Apps,
the customer's); SharePoint's own views of `Arkiveringslogg`; new archive features. Usage
statistics for the archive are a decision (D6), not this plan's scope by default.

## Where the branches stand (2026-11-16)

### The rebase

`feat/archive` was rebased on `origin/main`, then `feat/archive-dashboard` on it, both with rename
detection off (`-X no-renames`): no file the archive touches was moved on `main`, and with it on,
git paired the archive's new `ArchiveSelection` with `main`'s changed `ArchiveView`. Each result
was checked against a single three-way merge (`git merge-tree`): they differ only in the files
resolved by hand. Conflict markers: none. Loc triads balanced: ProjectWebParts 531 keys and
PortfolioWebParts 434, no duplicates, no `,,`. Resolutions that change what either side wrote:

1. **The archive webhook is gone**, as the branch intends: `runArchiveHook`, `hookArchiveUrl` and
   `hookArchiveAuth` (web part properties, manifest, property pane). `main`'s later fix to it
   (`void fetch`, the hook running when the log was not written) went with it. Breaking for
   customers whose flows hang on the webhook: «Fjernet» in the changelog, and the trigger on the
   list (`docs/fasebytte-og-arkivering.md`, D) in the release notes.
2. **The archive log keeps `main`'s error handling.** `main` moved `logArchiveOperations` to
   `ChangePhaseDialog/Actions/logArchiveOperations.ts` (with a test): it returns the hub's first
   error and stops on denied access. The archive's `spItemId`, `operation` and new import path
   were carried into it; its own copy in `Actions.tsx` (a `Logger` warning) was dropped.
   `SPDataAdapter` keeps `main`'s `Promise<Error | null>` and `isAvailable` check, with the
   archive's `itemId` and `operation` parameters and fields.
3. **One `FileTypeIcon`.** Both sides added one to shared-library; `main`'s (`FileTypeIcon.tsx`,
   tested, no Fluent v8) stays, the archive's `FileTypeIcon/index.tsx` went (beside `main`'s
   `index.ts` both would have emitted `index.js`). Its callers still pass a file name where `main`'s
   takes an extension (slice 0).
4. **The change-phase dialog stays a `dialog`.** The archive's `modalType='alert'` was dropped:
   Fluent ignores Escape on an alert dialog (pp365-a11y), `main` closes it on Escape and ignores a
   backdrop click itself, and `main`'s tests find it as `dialog`. `main`'s `aria-describedby` and
   focus on the content were kept, the archive's width and summary added.
5. **`main`'s accessibility fixes in components the archive deleted** did not survive: the old
   `ArchiveView` (section headers as buttons with `aria-expanded` and `aria-controls`, a
   `:focus-visible` ring) and `ArchiveStatusPopover` (status text no longer in the warning's orange,
   which read 2:1). Their equivalents in the new components are slice 5's.
6. **Lint:** the archive's `no-console` allow-list lived in `SharePointFramework/.eslintrc.yaml`,
   which `main` replaced with the ESLint 9 flat config; it was not carried over, and `main`'s
   `eslint-disable no-console` lines stay in the files outside the archive. The archive's stray
   `useState` import in the footer's `Assistant.tsx` was dropped (an error under
   `unused-imports`).
7. **Channels and build:** `arkiv` joined `-Channel`'s set in `Install/Build-Release.ps1` and
   `build:arkiv` the two solutions' scripts; `main`'s Node 26 guard replaced the archive's nvm
   switch (written for SPFx 1.17.4 on Node 16). The archive's `$env:SERVE_CHANNEL` lines stayed;
   `main`'s `modifySolutionFiles.js --force` makes them redundant.
8. **Docs:** «docs: dev guide channels» became empty, since `main`'s `maler/kanaler.md` covers the
   same ground, and was dropped; the generated `.development-guide/README.md` is `main`'s until
   `npm run generate-readme`.
9. **Dashboard:** `PortfolioWebParts/package.json` takes the dashboard's four dependencies on
   `main`'s list; `common/config/rush/pnpm-lock.yaml` is `main`'s and lacks them (D2, slice 0).

### What does not build or pass yet

Nothing has been built since the rebase. A read of the code on 2026-11-16 finds:

- **Compile errors.** `format` from `@fluentui/react` (no longer a dependency of the solutions;
  `main` takes it from `pp365-shared-library`): `ArchiveDialog.tsx`, `ArchiveSelection.tsx`,
  `SelectionSummary.tsx`, `ArchiveOverview.tsx`, `useArchiveData.ts`. `IColumn` from
  `@fluentui/react` in `useArchiveOverview.ts`. PnPjs 3's `getAll()` and
  `@pnp/sp/items/get-all` in `useArchiveData.ts` (`getAllItems` in shared-library replaces it). The
  dashboard's filter panels pass `isOpen` and `onDismiss`, which `main`'s `BasePanel` calls `open`
  and `onClose`.
- **`main`'s tests of what the archive replaced:**
  - `ArchiveStatus.test.tsx` reads `ARCHIVE_STATUS_COLORS` (gone: a compile error), mocks the old
    hook's return, and expects the section's `h3` (now in `ArchiveSection`) and the popover's tags;
  - `ChangePhaseDialog.test.tsx` mocks `./Views/ArchiveView/useArchiveView` (gone: the suite fails
    to load), and its WCAG 4.1.2 test reads the old section buttons;
  - `ProjectPhases.test.tsx` passes `hookArchiveUrl` and `hookArchiveAuth` (a compile error);
  - `useProjectPhasesDataFetch.test.tsx`'s adapter has no `getArchiveHistoryForItems`;
  - `useProjectInformationDataFetch.test.tsx` passes no `useArchive`, so the status it expects
    is no longer fetched;
  - the `usePhaseHooks` mocks still return a pair (harmless).
- **Lint and format** (errors fail the build): `ArchiveOverview`'s `defaultProps`, unused imports
  (`ArchiveOverview.tsx`, `LogStatusBadge.tsx`, `ArchiveSelection.tsx`), and Prettier throughout
  the dashboard (aligned columns, trailing commas, lines over 100) and in places in the dialog.
- **Dependencies:** `@fluentui/react-charting` 5.13.11 is Fluent v8 and brings `@fluentui/react` 8
  into PortfolioWebParts, which AGENTS.md rules out; `react-dropzone`, `@fluentui/react-motion` and
  `@fluentui/react-motion-preview` are imported nowhere. The lockfile has none of them, so
  `rush install` fails until `rush update` (after D2).
- **Coverage:** some 5,200 lines of TypeScript arrive without a test (`ArchiveDialog` 1,933,
  `ArchiveStatus` 611, `ArchiveOverview` 2,147). ProjectInformation's and the change-phase
  dialog's tests load the archive components, so ProjectWebParts' floors (60/72/58/60) will very
  likely be missed; PortfolioWebParts' (67/78/56/67) as soon as a test loads the dashboard. Only
  `Build-Release.ps1` fails on a floor.
- **CI:** `ci-channel-arkiv.yml` runs on every push to both branches. It sets up Node from
  `vars.NODE_VERSION`, which is 16.18.0, so the build stops at `main`'s Node 26 guard and deploys
  nothing; a push is red until D3, which modernizes it on `feat/archive` (2026-11-17). The test
  channel's workflows do not run on these branches.

## Inventory (from the code, 2026-11-16)

| Surface | Code (on the branch) | Reached by | Tests today |
|---|---|---|---|
| Archive section in Prosjektinformasjon: title, «Start arkivering», status | `ProjectInformation/ArchiveSection` | Prosjektinformasjon's `useArchive` (off by default; replaces `hideArchiveStatus`) | None |
| Archive status: message bar, popover with `ArchiveStatusDetails` (summary, segmented bar, filter chips, sortable operations table, refresh) | `ProjectInformation/ArchiveStatus` | The section, when the log has rows for the project | `main`'s test of the old popover (broken) |
| Manual archive dialog: selection, summary, progress, done; refresh; close confirmation | `ArchiveDialog/ArchiveDialog.tsx`, `useArchiveDialog.ts`, `useArchiveDialogData.ts`, `ArchiveProgress` | «Start arkivering» (`OPEN_DIALOG('ArchiveDialog')`, `ArchiveDialogContainer`) | None |
| Selection, shared: info card, documents table (search, filter menu, select all, «previously archived» and «modified after» stamps), lists table | `ArchiveDialog/ArchiveSelection` | The dialog and the phase change's archive step | None |
| Phase change's archive step: current phase's and phase-less documents; confirmation with summary, «Tilbake», close button | `ProjectPhases/ChangePhaseDialog` (`Views/ArchiveView`, `Actions`) | Fasevelger's `useArchive`, after the checkpoints | `logArchiveOperations.test.ts`; `ChangePhaseDialog.test.tsx` (broken) |
| Archive log on the hub: writes and reads | `ProjectWebParts/src/data/SPDataAdapter` (`getDocumentsForArchive`, `getListsForArchive`, `writeToArchiveLog`, `logDocumentArchive`, `logListArchive`, `getArchiveStatus`, `getArchiveHistoryForItems`); `shared-library` `DefaultCachingRefresh`, `getDocumentTypes(refreshCache)` | All of the above | None |
| Arkivoversikt on the hub: nav (Oversikt, Prosjekter, Dokumenter, Lister, Arkivlogg; Innstillinger a placeholder), day range, refresh, cards, line and donut charts, quick stats, four tables with search, Excel export, filter panel, sorting, column resize | `PortfolioWebParts/src/components/ArchiveOverview`, `webparts/archiveOverview` | The hub page `Arkivoversikt` (`Templates/Portfolio/Objects/ClientSidePages/Arkivoversikt.xml`) | None |
| Templates | `Arkiveringslogg` with the new `GtLog*` fields, `Arkiveringsloggelement`, the Arkivoversikt page, resx | The upgrade | `integration/tests/template.test.ts` knows none of them |

## Findings the plan acts on

Read from the code, not yet seen in a browser. Each gets a failing test before its fix.

- **F1. A manual archive always reports success.** `runArchive` in `useArchiveDialog.ts` counts
  only what `logDocumentArchive` and `logListArchive` throw, and both return the hub's error
  instead (`main`'s contract). An unreachable hub or a denied write reads as done, and «Prøv igjen»
  writes every row again. The phase change reads the returned error (`logArchiveOperations`).
- **F2. Reads stop at 100.** The documents (`getDocumentsForArchive`) and the log
  (`getArchiveStatus`, `getArchiveHistoryForItems`) are read without `$top`, so the selector shows
  the first 100 documents and the status and stamps count the newest 100 rows. `GtLogWebUrl` has
  no index, so a log past 5,000 rows fails, and the failure is swallowed.
- **F3. Values are stored as the user's language.** Status, operation and scope are written from
  the UI's strings (`Til arkiv` or `To archive`, `Dokument` or `Document`). The dashboard compares
  Norwegian scope literals, the English dashboard expects `Failed` where the project writes
  `Error`, and the documented external flow triggers on `Til arkiv`.
- **F4.** `GtLogBatchId`, `GtLogCaseId`, `GtLogCaseResponsibleEmail`, `GtLogFromPhase`,
  `GtLogToPhase` and `GtLogJournalPostId` are provisioned but never written.
- **F5. The dashboard reads everything at once.** All of `Arkiveringslogg` and `Prosjekter`
  (titles hard-coded), on every load, with no cancellation. Projects match by `/sites/<name>`,
  never `/teams/`. No table pages.
- **F6.** Failed reads become empty results (documents, lists, terms, status, history), so a 403
  shows «nothing to archive» and the dialog's error state is out of reach. The phase change's
  archive step reads cached documents (60 minutes) with no refresh.
- **F7. Accessibility**, against pp365-a11y's rules (slice 5 confirms each in the browser):
  - clickable `div`s and `th`s with no `aria-sort` (the dashboard's cards, quick stats and sort
    headers);
  - column resize by mouse only (`useColumnResize`; the dialog's tables have no keyboard mode);
  - unnamed controls: selection checks, progress bars, icon-only sort headers, the dashboard's
    search boxes;
  - a tooltip and an `aria-label` both naming the same thing, and tooltips out of the keyboard's
    reach;
  - hex colours, `#b27a00` text at about 3.7:1, and status by colour alone (the segmented bar,
    the failed count);
  - nothing announced for loading, search counts, refresh or the day range, and the status bar
    announced on every page load;
  - no `useRestoreFocusTarget` on «Start arkivering», and each step of the dialog removes the
    focused button;
  - `modalType='alert'` on the archive dialog and its close confirmation, so Escape does nothing;
  - nested `FluentProvider`s inside wrappers that have one;
  - `ArchiveSection` without `headingLevel={3}`, and no headings at all on the dashboard;
  - unnamed tables and a chart without a text alternative;
  - text not from the loc triad (`'nb-NO'`, `'(ukjent)'`, `'#'`, `'Archive'`), and inline
    styles.
- **F8. The archive status's switch changed meaning.** `useArchive` replaced Prosjektinformasjon's
  `hideArchiveStatus`, with no upgrade step: a page where the status was turned on
  (`hideArchiveStatus: false`) shows none after the upgrade until `useArchive` is turned on. Release
  notes (slice 6), or an upgrade step that carries the setting over (pp365-templates).
- **F9. `DefaultCachingRefresh`** (shared-library `data/cache.ts`) puts an `on.pre` of its own
  before PnPjs' `Caching` and deletes the cached entry under `LocalCaching`'s key. That it runs
  first, and that the key is the one `Caching` stores under, only real PnPjs shows: a runtime
  contract test in `shared-library/test/runtime` (pp365-testing), slice 2.

## Decisions (proposed)

- **D1. Order and target.** `feat/archive` is merged first, by pull request into the release
  branch then open (1.16), squash; the dashboard is rebased on that squash and follows in its own
  pull request. Both green on the test channel (Jest, integration, e2e) before their merge.
- **D2. The dashboard's charts** use Fluent v9 (`@fluentui/react-charts`), or bars of our own with
  their numbers in text, not `@fluentui/react-charting` (Fluent v8). Either way each chart has its
  numbers beside it in text or a table (1.1.1, 1.3.1), and the three unused dependencies go. Then
  `npm run rush:update`, and the lockfile in the same commit as `package.json`.
- **D3. CI for the archive branches (decided 2026-11-17: keep the arkiv workflow, modernized).**
  `ci-channel-arkiv.yml` builds the arkiv channel and upgrades a hub of its own,
  `sites/pp365-arkiv`, so the archive can be tried on the tenant while 1.15's release holds the
  shared test hub until 19.11. It is rewritten from `ci-channel-test.yml`'s build and upgrade jobs
  (pp365-release): Node from `.nvmrc`, `ubuntu-latest`, actions v7 and v8, tags from the subject
  with `[apps-only:<names>]`, the run number stamped into the versions, the package uploaded with
  its `.current-channel-config.json`, the secrets as `$env:` references, `permissions`, a
  `concurrency` group, a timeout on every job (the full upgrade 90 minutes, 36 to 62 measured on
  macOS), the Rush logs on a failure, and `workflow_dispatch`. It runs no e2e or integration
  tests: they need a hub's project and program sites and their variables, so they run on the test
  channel by dispatch after 19.11 (`gh workflow run ci-channel-test.yml --ref feat/archive`: no
  commit, the full path; the branch's build stays on the shared test hub until the next run
  there). The dashboard branch's copy differs only by its trigger (`feat/archive-dashboard`); it
  stays red until that branch is rebased on this, and keeps that one line then. The file belongs
  to the branches: the pull request's last commit deletes it, and whether `channels/arkiv.json`
  and its footer id in `EnsureFooterExtension.ps1` go with it is decided then.
- **D4. One stored vocabulary** for status, operation and scope, independent of the user's UI
  language: fixed values written by the project, read by the dashboard and named in the external
  flows' contract, with the UI's text from the strings. Rows written so far are Norwegian, so the
  fixed values are the Norwegian ones unless the user decides otherwise.
- **D5. Test data on the tenant.**
  - A page `Arkiv.aspx` on the e2e project with Prosjektinformasjon and Fasevelger, both with
    `useArchive` on, added by `npm run add-archive-page -- <project url>` in `integration/`, as
    `add-matrix-page`; the specs skip with the reason until it exists.
  - The hub's `Arkivoversikt` page comes with the upgrade.
  - Integration writes only rows it creates in the hub's log and files in
    `INTEGRATION_PROJECT_URL`; the e2e flows write rows and files on the e2e project. Both delete
    what they wrote in `finally`, finding the rows by `GtLogItemId`, since the add discards its
    result.
  - Before the first write: confirm no flow on the test tenant acts on `Til arkiv`.
- **D6. Usage statistics** for the archive (manual archive started, done or failed; the
  dashboard opened) change the contract (`contract.ts`, Assist's copy, the fixture, the wiki page;
  Assist first). Proposed: not now; after the feature has shipped.

## Slices and order

| # | Slice | Scope | Exit |
|---|---|---|---|
| 0 | Build on 1.15 | The compile errors and `main`'s tests above; `FileTypeIcon`'s callers pass the extension; `npm run lint` in the three solutions; `npm run validate-loc` (read its report); D2's dependencies and `rush:update`; `channels/arkiv.json` against `main`'s components (`npm run generate-channel-config arkiv /update`, then `npm run check-channel-ids`); D3 (`ci-channel-arkiv.yml` modernized) | `rush rebuild` green; both branches pushed (`--force-with-lease`); `ci-channel-arkiv.yml` green on `feat/archive`, and the test channel's dispatch after 19.11; coverage read, floors probably missed until slice 2 |
| 1 | Correctness | F1, F2 (`getAllItems`; an index on `GtLogWebUrl` in the template, with its upgrade step), F3 per D4, F5's fetch (paged, cancelled, `/teams/`), F6's surfaced errors and the archive step's refresh, F4 written or dropped from the template | Each fix behind a failing Jest or integration test |
| 2 | Jest | Unit: the log's grouping and the history's keys (`GtLogItemId`, then `GtLogReference`, then `Title`), moved to modules of their own with their inputs passed in (as `ProgramWebParts/src/data/childProjectRemoval.ts`); `useArchiveDialog`'s runner (progress, failures counted, retry of the failed only); `useArchiveSelection` and `useArchiveTable` (search, filters, select all, disabled rows); `useArchiveStatus` (counts, intent); `useArchiveData` and `useArchiveOverview` (status mapping, day range, filters); `useColumnResize`. Components with RTL and `axeComponent`: `ArchiveSelection`, `SelectionSummary`, `ArchiveProgress`, `ArchiveDialog`'s steps, `ArchiveSection` (h3, the button, focus back), `ArchiveStatus` with `ArchiveStatusDetails` (popover stand-in), the archive step and confirmation in `ChangePhaseDialog`, and `ArchiveOverview` (charts stubbed, D2). Runtime: `DefaultCachingRefresh` against real PnPjs (F9) | Floors held and raised where the new tests lift them |
| 3 | Integration | `integration/tests/archive-log.test.ts` through `projectWebPartsAdapter()`: a document's and a list's rows written with every field, read back by `getArchiveStatus` and `getArchiveHistoryForItems`; the history still matched after a rename (a file in `INTEGRATION_PROJECT_URL`); more than 100 documents and log rows (F2); `getListsForArchive` without system lists; a denied write returns its error. `template.test.ts`: the new fields, the index and the Arkivoversikt page after the full upgrade | Green in CI's integration job; `[apps-only]` runs skip the template part as today |
| 4 | E2E | `npm run add-archive-page` (D5). `tests/smoke/archive.spec.ts`, reading only: the section (h3, button), the dialog (search, filter, select all, back, refresh, close confirmation; Escape and the focus back on «Start arkivering»), the status popover, the phase change through Skip to the archive step and the confirmation, never «Ja»; the hub's Arkivoversikt (nav, day range, tables, export download). `tests/flows/archive.spec.ts`, writing: one uploaded document and one list archived by hand, their rows in the log, the stamps on reopening, then deleted. Each surface scanned with `scanAccessibility` under its own name: `ArchiveSection`, `ArchiveDialog`, `ArchiveStatusDetails`, `ChangePhaseDialog-archive`, `ArchiveOverviewWebPart` | Green on the test channel; the scans in report mode |
| 5 | Universal design | F7 fixed per surface by pp365-a11y's audit: axe, jest-axe, keyboard, NVDA with Edge or Chrome and VoiceOver with Safari on the Norwegian test hub, 200 % zoom and reflow at 320 px, contrast and forced colours, forms. `main`'s lost fixes (rebase item 5) carried to the new components | Each surface's row in `tilgjengelighet.md`, its box in #1788, its scan in `A11Y_BLOCKING` |
| 6 | Docs and release | `testoversikt.md` rows (Prosjektinformasjon's archive, Fasevelger's archive step, the archive log, Arkivoversikt); `docs/fasebytte-og-arkivering.md` brought up to date (the `Views/ArchiveView` path, `main`'s error handling, D4's values, the fields written); `CHANGELOG.md` (Ny funksjonalitet; Fjernet: the webhook); release notes (with F8); `tilgjengelighet-wcag.md` if a criterion's state changes; the manual smoke test lists only what CI does not cover, each with its reason (the external flow, a real phase change with archive, the hand round) | The pull requests per D1 |

Slices 0 and 1 go on `feat/archive` first, then the dashboard's share on `feat/archive-dashboard`
after a rebase on it. Slices 2 to 5 go surface by surface, each a commit with its tests and its row,
as the universal design plan did. A finding that needs a product decision (a chart alternative,
the dashboard's pagination) is split out with an issue rather than holding a surface.

## Rules for the executing agent

- Read `AGENTS.md`, pp365-testing, pp365-a11y, pp365-ui, pp365-toolchain, pp365-templates and
  pp365-release first, and this plan's findings.
- Tests first: a bug or a missing name gets a failing test before its fix. Never delete or loosen
  an assertion from `main` to go green; rewrite it against the new component, keeping what it
  checked (the section's `h3`, a dialog found as `dialog`, `trapFocus`, the colours' 3:1).
- Never import `@pnp/*` in Jest; mock the adapter (`jest.mock` above the imports). Fluent's
  popovers and comboboxes get the stand-ins pp365-testing names; a Fluent v9 load costs 15 to 45 s
  per file, so a surface's tests share a file.
- The scans of the archive's surfaces carry their own component names. `ProjectInformationWebPart`
  and `ChangePhaseDialog` are blocking already: `Arkiv.aspx` stays out of `e2e/tests/fixtures/pages.ts`,
  and its scans stay in the archive specs, until they are clean.
- Integration writes only to `INTEGRATION_PROJECT_URL` and to hub rows it created; e2e flows clean
  up after themselves; nothing writes to the e2e project from an integration test.
- Every user-facing text from the loc triad, `validate-loc` read after each loc change; `format`
  from `pp365-shared-library`; no Fluent v8 in a solution.
- Never the developer's git; each batch ends with a commit message, its CI tag per pp365-release.
  The branches change `Templates/` (the log's fields, the Arkivoversikt page) and slice 1 may
  again (the index), so those pushes and the merges take the full path, not `[apps-only]`.

## Risks

- **The shared test hub.** Dispatched runs leave the branch's build on `pp365-test` until the next
  run there, and writes leave rows in its log if a clean-up fails; the flows delete by
  `GtLogItemId`, and the spec lists what it left.
- **A flow on `Til arkiv`.** One listening on the test hub would archive the test's files (D5).
- **The blocking scans.** An archive surface scanned under a blocking name before it is clean turns
  CI red for work not begun (the rule above).
- **Coverage.** The floors fail only in `Build-Release.ps1`; read Jest's summary on every slice.
- **The charts.** Fluent's charts are SVG with their own semantics; the text or table beside them
  carries the information either way (D2).
- **D4 touches stored data.** A customer's existing rows and flows read the old values; the release
  notes say what changes.
- **The webhook's removal** breaks a customer whose flow listens on it.

## Definition of done

Both branches merged per D1 with every slice's exit met: `rush rebuild` and the release build green
with the floors held; integration and e2e green on the test channel; every archive surface audited,
recorded in `tilgjengelighet.md` and blocking in the browser suite; `testoversikt.md`,
`docs/fasebytte-og-arkivering.md`, the changelog and the release notes updated.

## Slice log

### The rebase (2026-11-16)

`feat/archive` from bec84468b to 2fbf493c3 on `origin/main` 9ca538a0c (18 of 19 commits; «docs:
dev guide channels» became empty), `feat/archive-dashboard` from 3f0485c97 to 016ed0941 (15
commits). Resolutions as in «The rebase» above; one was corrected the same day (`modalType='alert'`
kept with `main`'s Escape handling in commit «feat: revamp look and feel of archive dialog», then
dropped there and the later commits replayed). Not built. Pushing needs `--force-with-lease`.

### Slice 0 on `feat/archive` (2026-11-16)

Both branches pushed first, each with `--force-with-lease` against its old tip. The push ran
`ci-channel-arkiv.yml` on both: the build stopped after 25 s (run 43965851529: Node 16 against
`main`'s guard), the upgrades were skipped, nothing was deployed. Then, in a worktree on
`feat/archive` with its own `rush install` (Node 26.13.0):

- **Compile and Sass.** `format` from `pp365-shared-library` in `ArchiveDialog.tsx`,
  `ArchiveSelection.tsx` and `SelectionSummary.tsx`. `ArchiveSelection.module.scss` imported Fluent
  v8's `References.scss`, used for nothing, and the Sass build failed on it (`@fluentui/react` is no
  dependency of the solution). `ChangePhaseDialog.tsx` imported `DISMISS_CHANGE_PHASE_DIALOG`
  twice, a leftover of the rebase's resolution.
- **File type icons.** `getFileExtension` (with a test) gives `FileTypeIcon` the extension: with
  the whole name, every document had the generic icon.
- **`main`'s tests**, rewritten against the new components:
  - `ArchiveStatus.test.tsx` renders `ArchiveSection` and keeps each assertion: the section's `h3`
    (`ArchiveSection` gets the `headingLevel={3}` `main`'s status had), the details as a dialog
    named by them that holds the focus, and the status colours. The colours carried one of
    `main`'s lost fixes (rebase item 5) into `ArchiveStatusDetails` ahead of slice 5: the status
    tag's icon takes the status's colour (`ARCHIVE_STATUS_COLORS`, `main`'s values, 3:1 against a
    hovered row) and its text none (the warning's `#b27a00` text read 3.7:1). The summary's counts
    and the segmented bar keep the archive's hex colours (F7).
  - `ChangePhaseDialog.test.tsx`: the archive step's sections no longer fold, so its WCAG 4.1.2
    test finds each section's table by its name, and a check that follows the selection. The
    checks have no name yet (F7).
  - `ProjectPhases.test.tsx` lost the webhook's props, and the `usePhaseHooks` mocks return the
    one hook (three files). `useProjectPhasesDataFetch.test.tsx` asserts the history and the
    document types' names. `useProjectInformationDataFetch.test.tsx` passes `useArchive`, with a
    new case that reads no status without it.
- **Lint.** `npm run lint` fixed Prettier in four files and dropped an unused `mergeClasses`;
  `FilterChip` moved above its first use (`no-use-before-define`, an error).
- **Channels.** `npm run check-channel-ids` failed: `EnsureFooterExtension.ps1` did not list the
  arkiv channel's footer, and `Build-Release.ps1` runs the check before every build, whichever the
  channel. It lists it now. `npm run generate-channel-config arkiv /update` dropped
  `ProjectProvisionWebPart`, gone from `main` since 1.14.
- **Results.** ProjectWebParts' `heft test --clean`: 75 suites and 474 tests, none failed;
  coverage 71.77, 73.40, 66.12 and 71.77 % (statements, branches, functions, lines) against the
  floors 60, 72, 58 and 60, branches the closest. Lint: no errors (73 warnings). `validate-loc`:
  531 keys, none missing. `npm run test:tasks`: 102 of 102. Templates' tests: 8 of 8 after its
  build; their `validate-loc`: 1,495 keys, none missing. `check-channel-ids`: clean. `rush
  rebuild` (NODE_OPTIONS at 8 GB, as CI): green in 9 min 42 s, 12 operations (6 with warnings),
  every solution above its floors (ProjectWebParts' branches the closest: 73.40 against 72).
- **D3 (2026-11-17).** The user chose to keep the arkiv workflow, and `ci-channel-arkiv.yml` is
  rewritten as D3 says. A diff against `ci-channel-test.yml`'s build and upgrade jobs, with the
  channel's names swapped, leaves the triggers, the hub's address, the full upgrade's timeout and
  the comments. Checked locally: the YAML parses (js-yaml), every job has a timeout and runs on
  `ubuntu-latest`, every `needs` names a job, no `if` reads the whole message, no script holds a
  secret, both package uploads take the dotfiles, and both builds stamp the run number. For Linux:
  the 51 TypeScript files the branch changes resolve their 168 relative and `baseUrl` imports
  with the exact case, and the templates' 421 file references do too, but for two on `main`
  (below).
- **First run (2026-11-17).** Pushed as `2c130c006`, `69f823422` and `6233df574`. Run
  44044750128 was green on `ubuntu-latest`: the build took 15 min (every solution 1.15.0.15, six
  `*-arkiv.sppkg`), the full upgrade of `sites/pp365-arkiv` 33 min ("Channel: arkiv"). The
  project sites under the hub were not upgraded (no `[upgrade-all-sites-to-latest]`). A project
  shows the archive only once «Bruk arkivfunksjonalitet» (`useArchive`, off in both manifests and
  set by no template) is on in Prosjektinformasjon and in Prosjektfaser (F8).
- **Not done.** The test channel's dispatch (after 19.11), and the dashboard's share of the slice
  (after its rebase on this).
- **Found.** F8 and F9. On `main`, `Templates/Portfolio/Objects/Lists/@.xml` includes
  `FasesjekklisteV6.xml` and `PlanneroppgaverV6.xml`, where the files are `Fasesjekklistev6.xml`
  and `Planneroppgaverv6.xml`; `main`'s Linux builds pass with them. Left for `main`.
