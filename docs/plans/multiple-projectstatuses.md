# Multiple Project Status pages per project

## Context

Today every project site is provisioned with exactly one `Prosjektstatus.aspx` page (a `SingleWebPartAppPage` hosting the ProjectStatus SPFx web part). All status reports for all projects are stored in a single hub-site list, **Prosjektstatus**, and a report is tied to its project solely through the text field `GtSiteId` (the project site GUID). Every consumer — the ProjectStatus web part itself, ProjectInformation, Portfolio overview (KQL), the StatusReportColumn (REST), Program web parts and the timeline — assumes **one report series per project** and resolves "the latest report" by taking the newest item for a given `GtSiteId`.

We want a project to be able to have **multiple Prosjektstatus pages**, each with its own independent report series (own create/edit/publish flow). Items in the hub list must carry enough identity to distinguish each page instance's series from the others.

## Decisions

1. **Creation**: extra status pages are provisioned as **Prosjekttillegg** (project add-ons) through the existing template system.
2. **Identity**: auto-derived **page ID** — a new text field stores the page's SitePages item `UniqueId`, plus denormalized page title/URL for display and deep links. Zero configuration; survives rename; a copied page automatically becomes its own series.
3. **Portfolio behavior**: **one row per status page** — the default series keeps today's row; each additional series adds a row labeled "{Prosjektnavn} – {Sidetittel}" showing that series' latest published report in all status columns.
4. **Shared setup**: all pages share the same content type (`0x010022252E35737A413FB56A1BA53862F6D5`) and the same Statusseksjoner configuration.
5. **Backwards compatibility**: the default provisioned page keeps writing reports **without** a page ID (all legacy reports already have it null) — no data migration. Only additional pages stamp their page ID.

## Core concept

A report series is identified by `(GtSiteId, GtStatusPageId)` where empty/null `GtStatusPageId` ⇔ the default page's series. Three new hub text fields, stamped on every new report from an extra page: `GtStatusPageId` (page UniqueId, lowercase), `GtStatusPageTitle` (row label), `GtStatusPageUrl` (site-relative page path for deep links). Stamping current values on each new report caps rename staleness; consumers read the label/URL from the newest report of a series.

Default-series OData predicate (legacy items have **null**, form-cleared items may have `''` — must match both):
`(GtStatusPageId eq null or GtStatusPageId eq '')`; extra page: `GtStatusPageId eq '<pageUniqueId>'`.

The web part gets a boolean property `useSeparateReportSeries` (default false/absent), set to `true` only in the add-on template. False ⇒ exactly today's behavior + default-series filter; true ⇒ derive own page identity, filter and stamp by it.

---

## Part 1 — Templates / provisioning

1. **New site fields** (model on `GtSiteId.xml`: Type=Text, hidden from all forms via `ShowInDisplayForm/EditForm/NewForm="FALSE"` — this also keeps them out of EditStatusPanel since `EditableSPField` excludes them; **no `<Default>`**, must stay null):
   - `Templates/Portfolio/Objects/SiteFields/GtStatusPageId.xml`
   - `Templates/Portfolio/Objects/SiteFields/GtStatusPageTitle.xml`
   - `Templates/Portfolio/Objects/SiteFields/GtStatusPageUrl.xml` (plain Text, not URL type — simpler REST filtering)
2. **Register**: add `<xi:include>` entries in `Templates/Portfolio/Objects/SiteFields/@.xml`; add three `<pnp:FieldRef ... UpdateChildren="true">` in `Templates/Portfolio/Objects/ContentTypes/ProjectStatus/Prosjektstatus.xml` (after `GtLastReportDate`); add to `<pnp:FieldRefs>` in `Templates/Portfolio/Objects/Lists/Prosjektstatus.xml` (+ `GtStatusPageId`/`GtStatusPageTitle` in the AllItems view for admins).
3. **Resources**: 6 new keys (`SiteFields_GtStatusPage{Id,Title,Url}_{DisplayName,Description}`) in `Templates/Portfolio/Resources.no-NB.resx` + `Resources.en-US.resx`; regenerate with `npm run generate-project-templates` in `Templates/`.
4. **Prosjekttillegg** — new `Templates/Content/Portfolio_content.no-NB/Prosjekttillegg/EkstraStatusside.json`: one `ClientSidePages` entry, `Name: "Prosjektstatus-2.aspx"`, `Title: "Prosjektstatus 2"`, `PageLayoutType: SingleWebPartAppPage`, single Factor-12 column with control id `681ad0dc-ddb5-4dba-a5d6-a42f6d1c90a6` (main-channel ProjectStatusWebPart id from `channels/main.json`) and Properties `{ title, useSeparateReportSeries: true, riskMatrix, opportunityMatrix }`.
   - **No `"Overwrite": true`** — the ClientSidePages handler skips existing pages, so re-applying is idempotent; recreation would mint a new UniqueId and orphan the series.
   - **No `Navigation` block** — the sp-js-provisioning Navigation handler does a full quick-launch replace and would wipe the project menu. v1: users add the nav link manually. Optional follow-up: add an additive `QuickLaunchAppend` mode to sp-js-provisioning and then ship the nav node in the tillegg.
   - Register in `Templates/Content/Portfolio_content.no-NB/Portfolio_content.no-NB.xml` as a `<pnp:File>` into the `Prosjekttillegg` folder with `Title`/`GtDescription` properties, **without** `GtExtensionHidden`. Optionally author the en-US twin.
   - **Applying to an existing project needs no new code**: ProjectInformation → `RunProjectSetupDialog` re-runs the setup wizard; the user picks "No template" (`NO_TEMPLATE_ID`) and checks the tillegg — `ApplyTemplate` then applies only the extension schema.
5. **Upgrade path**: `Install/Install.ps1 -Upgrade` re-applies `Portfolio.pnp` (Fields/ContentTypes/ListInstances handlers included) → new columns provision automatically; content template re-applies with `Files` handler → tillegg uploads to existing hubs. No PostInstallUpgrade migration needed. Search managed properties (`GtStatusPageIdOWSTEXT`, `GtStatusPageTitleOWSTEXT`, `GtStatusPageUrlOWSTEXT`) auto-generate after the next crawl of stamped items — portfolio rows for new series appear only after crawl.

## Part 2 — shared-library

1. **`src/models/StatusReport.ts`**: getters `statusPageId` (lowercased text of `GtStatusPageId`, `''` default), `statusPageTitle`, `statusPageUrl`; `url()` uses `statusPageUrl` when non-empty, else the existing `resource.Navigation_ProjectStatus_Url` fallback (legacy → byte-identical URL).
2. **`src/services/PortalDataService/types.ts`**: `GetStatusReportsOptions` extended with `statusPageId?: string | null` (`null` = default series, GUID = that series, omitted = all series for aggregation callers).
3. **`src/services/PortalDataService/PortalDataService.ts`** `getStatusReports`: after the default `GtSiteId` filter fallback, when `statusPageId !== undefined` compose `(<filter>) and <seriesFilter>`. `addStatusReport`/`publishStatusReport`/attachments need **no** changes (attachments folder is keyed by report id — series-safe).
4. **New `src/util/statusReportSeries.ts`** (exported from `util/index.ts`) — shared by Portfolio- and ProgramWebParts:
   - `getStatusPageSeriesKey(statusPageId?)` → trimmed/lowercased, `''` for null/undefined.
   - `getStatusPageSeriesFilter(statusPageId?)` → the OData predicates above.
   - `sortStatusReportsLatestFirst(reports)` → numeric `ListItemId` desc.
   - `groupLatestReportBySeries(reports, siteIdProperty, statusPageIdProperty)` → `Map<siteId, { defaultReport?, additionalReports[] }>`; keeps first occurrence per `(siteId, pageKey)` from pre-sorted input — degrades to the previous `.find` per site when no extra series exist.
   - `expandRowsPerStatusSeries(buildRow, series)` → `[baseRow, ...extraRows]`; extra rows get `Title` set to `"{baseTitle} – {pageTitle}"`, plus `StatusPageId`, `StatusPageTitle`, `StatusPageUrl` and a synthetic unique `key` (`"{SiteId}_{statusPageId}"`). `Path`/`SPWebUrl`/`SiteId` are not altered on extra rows (title link/project panel keep pointing at the project).

## Part 3 — ProjectWebParts

1. **`src/components/ProjectStatus/types.ts`**: `useSeparateReportSeries?: boolean` on `IProjectStatusProps`; `statusPage?: IStatusPageInfo` on `IProjectStatusData`. The toggle is **not** exposed in the property pane (template-only — toggling it on an existing page hides history); no manifest change (`hiddenFromToolbox` stays).
2. **`src/components/ProjectStatus/useProjectStatusDataFetch.ts`**: when `useSeparateReportSeries`, one REST call `sp.web.lists.getById(pageContext.list.id).items.getById(pageContext.listItem.id).select('UniqueId','Title','FileRef')` resolves the page identity (`pageContext.listItem.uniqueId` is internal-only in SPFx typings — public ids + REST also return fresh title/URL, solving rename staleness). Guard: `listItem` undefined (workbench) → default series + console warning. `getStatusReports({ useCaching: false, statusPageId: statusPage?.id ?? null })`. Everything downstream (reducer `mostRecentReportId`, toolbar selector, `hasUnpublishedReports`, carry-forward, publish/delete) is automatically series-scoped.
3. **`src/components/ProjectStatus/Commands/useCreateNewStatusReport.ts`**: carry-forward exclusion list extended with the three `GtStatusPage*` fields; when `statusPage` is set, Title = `format(NewStatusReportTitle, "{webTitle} – {pageTitle}")` and the three fields are stamped on the new report.
4. **ProjectInformation**: fetch unchanged (`GtSiteId` + Published, deliberately not page-scoped). `ProjectStatusReport/useProjectStatusReport.ts` returns one context per series (latest published per series, default series first, labeled with `statusPageTitle`); `index.tsx` maps over them rendering the existing `<Header/> + <SummarySection/>` blocks.

## Part 4 — PortfolioWebParts / ProgramWebParts (aggregation)

1. **`PortfolioWebParts/src/data/DataAdapter.ts`**:
   - `_fetchDataForView`: add the three `GtStatusPage*OWSTEXT` managed properties to the status-report select (KQL unchanged); sort via `sortStatusReportsLatestFirst`; also return `statusReportsBySite = groupLatestReportBySeries(statusReports, siteIdProperty)`.
   - `fetchDataForRegularView` / `fetchDataForManagerView`: replace the `statusReports.find(...)` merge with `flatMap` + `expandRowsPerStatusSeries`, preserving the spread order (report first, project wins collisions).
   - **`fetchMergedViewData` dedup — required fix**: key was `${item.SiteId}_${item._hubId}` and would silently drop every extra-series row; now includes `StatusPageId`.
   - `fetchTimelineProjectData`: budget/costs are project-level facts — filter to default series only to avoid double counting.
   - `src/data/types.ts`: `IFetchDataForViewItemResult` extended with `key?`, `StatusPageId?`, `StatusPageTitle?`, `StatusPageUrl?`. `key` matches what Fluent `DetailsList`/`Selection` use for row identity.
2. **StatusReportColumn**: `ProjectStatusModel` gets `statusPageId`; `useStatusReportColumn` matches on `(siteId, statusPageId)` — `'' === ''` preserves the old behavior for all legacy pairs; Created-desc order keeps "first match = latest per series".
3. **`ProgramWebParts/src/data/SPDataAdapter.ts`**: status queries select `ListItemId` + the three new managed properties; the three `.find` sites (regular/manager/batch views) replaced with the shared grouping + `expandRowsPerStatusSeries`; **deliberate minor fix**: `sortStatusReportsLatestFirst` applied after `cleanDeep` (previously relied on search `LastModifiedTime desc`, where an edited old report could outrank a newer one); timeline filtered to default series.
4. **Unchanged by design**: `ProjectList`/`ProjectCard` quick-launch links and the timeline `DetailsPopover` keep pointing at the default status page; row `Path`/title link keeps opening the project; PortfolioAggregation data sources are a separate pipeline (custom status-report data sources may want to exclude `GtStatusPageIdOWSTEXT:*`).
5. **Zero-extra-pages safety**: grouping degrades to the previous `.find`; row expansion returns one row built by the same spread; select additions are additive; `url()` falls back. Only the inert `key` prop is new.

## Verification (manual — no test runner exists in the repo)

1. **Regression pass (zero extra pages)** against a test tenant with existing data: default Prosjektstatus page (reports list, create/publish/delete), ProjectInformation widget, Portfolio overview regular + manager views, StatusReportColumn, merged multi-portfolio view, program project overview, timeline budget overlay, Excel export — all identical to before.
2. **Feature pass**: apply the tillegg to an existing project via ProjectInformation → RunProjectSetupDialog → "No template" + "Ekstra statusside". Create + publish reports on both pages; verify: each page only shows/carries forward its own series; report Title carries "{webTitle} – {pageTitle}"; hub-list items have `GtStatusPage*` stamped; ProjectInformation shows both series labeled; after a search crawl, portfolio shows an extra row "{Prosjektnavn} – {Sidetittel}" with that series' latest values; StatusReportColumn matches per row; timeline unchanged; drafts don't surface.
3. **Edge cases**: rename the extra page (series intact, new reports pick up new title/URL); re-apply the tillegg (page not recreated); project whose only published reports are in an extra series (base row shows empty status columns — correct); workbench (no `listItem`) falls back to default series with a warning.

## Key risks

- **Page delete + recreate** (or `Overwrite: true` in tillegg) orphans a series (new UniqueId) — documented; keep Overwrite out.
- **Managed-property crawl delay** — new series' portfolio rows appear only after search crawl; REST-based surfaces (StatusReportColumn, ProjectInformation, the pages themselves) work immediately.
- **Non-main channels** — tillegg hard-codes the main-channel web part GUID (existing tillegg convention); on test/kurs channels the control is skipped with a warning. Follow-up: extend `generate-project-templates.js` to token-replace tillegg.
- **OData null vs `''`** — always use the combined predicate from `getStatusPageSeriesFilter`; never `eq ''` alone.
- **shared-library version pinning** — Portfolio-/Program-/ProjectWebParts pin exact versions; bump together in the same release.

---

## Implementation summary

All parts of the plan are implemented (initial commit: `feat: init unique statusreports`).

### Templates / provisioning

- Three new hidden text site fields: `Templates/Portfolio/Objects/SiteFields/GtStatusPageId.xml`, `GtStatusPageTitle.xml`, `GtStatusPageUrl.xml` — registered in `SiteFields/@.xml`, the Prosjektstatus content type (with `UpdateChildren="true"`) and the hub list (`FieldRefs` + `GtStatusPageId`/`GtStatusPageTitle` in the AllItems view). No `<Default>` — empty/null marks the default series, so existing data needs no migration.
- 6 new resx keys (`SiteFields_GtStatusPage{Id,Title,Url}_{DisplayName,Description}`) in both languages; resources regenerated with `npm run generate-project-templates` (the generated loc files are gitignored and rebuilt on demand).
- New Prosjekttillegg `Templates/Content/Portfolio_content.no-NB/Prosjekttillegg/EkstraStatusside.json`, registered in `Portfolio_content.no-NB.xml` without `GtExtensionHidden`: creates `Prosjektstatus-2.aspx` hosting the ProjectStatus web part with `useSeparateReportSeries: true`. Deliberately **without** `Overwrite` (re-applying does not recreate the page, so the series survives) and **without** a `Navigation` block (the navigation handler replaces the whole quick launch — the nav link must be added manually, stated in the add-on description). Applies to existing projects via RunProjectSetupDialog → "No template" + the add-on.

### shared-library

- New util `src/util/statusReportSeries.ts`: `getStatusPageSeriesKey`, `getStatusPageSeriesFilter`, `sortStatusReportsLatestFirst` (numeric `ListItemId` desc), `groupLatestReportBySeries` and `expandRowsPerStatusSeries` — shared by Portfolio- and ProgramWebParts.
- `StatusReport` gained `statusPageId`/`statusPageTitle`/`statusPageUrl` getters; `url()` uses the stamped page URL with fallback to the default page. `statusValues` excludes the `GtStatusPage*` identity fields.
- `getStatusReports` supports `statusPageId: null | GUID | omitted`, and has an upgrade-safety fallback: if the query fails because the hub list does not have `GtStatusPageId` yet (apps upgraded before the template), it retries without the series predicate — the default page keeps working mid-upgrade.

### ProjectWebParts

- The web part derives its page identity with public APIs only (`pageContext.list`/`listItem` + one REST call returning `UniqueId`, fresh `Title` and `FileRef` — `listItem.uniqueId` is internal-only in SPFx typings). Workbench/no-listItem falls back to the default series with a console warning. Page title falls back to the file name when the page has no title.
- New reports are stamped with the three fields; report Title becomes "{webTitle} – {pageTitle}" (reusing `NewStatusReportTitle`); carry-forward is automatically series-scoped (the fetch is filtered) with the identity fields excluded.
- ProjectInformation shows the latest published report **per series**, default series first, additional series labeled with the status page title — reusing the existing `Header`/`SummarySection` components.

### Portfolio-/ProgramWebParts

- One row per status page in regular, manager and batch (program) views; extra rows are labeled "{Prosjektnavn} – {Sidetittel}" and carry a synthetic `key` (`{SiteId}_{statusPageId}`) for row identity.
- Required fix landed: the `fetchMergedViewData` dedup key now includes `StatusPageId` — without it every extra-series row was silently dropped in merged multi-portfolio views.
- The timeline budget/costs overlay filters to the default series in both packages (avoids double counting); the Program timeline's project rows skip extra-series rows.
- StatusReportColumn matches on `(siteId, statusPageId)`, and the `GtStatusPage*` fields are excluded from its section enumeration (a stamped report would otherwise render a bogus GUID "status" in the tooltip).
- Deliberate minor fix in ProgramWebParts: status reports are now sorted by `ListItemId` instead of relying on search `LastModifiedTime` order (an edited old report could outrank a newer one).

### Deliberately not done (follow-ups)

- **Version bumps** — all packages are versioned in lockstep (1.13.1) and symlinked locally; bumping belongs to the release process.
- **en-US tillegg twin** — no en-US Prosjekttillegg infrastructure exists; followed the existing no-NB-only convention.
- **Nav node in the tillegg** — requires an additive `QuickLaunchAppend` mode in sp-js-provisioning (separate npm publish + dependency bumps).
- **Property pane toggle** for `useSeparateReportSeries` — template-only by design; toggling it on an existing page would hide its report history.

### Verification notes

- Build order: shared-library before ProjectWebParts/PortfolioWebParts/ProgramWebParts.
- Portfolio rows for new series appear only after a search crawl has picked up `GtStatusPageIdOWSTEXT` etc.; REST-based surfaces (the status pages themselves, ProjectInformation, StatusReportColumn) work immediately.
- Manual test flow: apply the add-on to an existing project (RunProjectSetupDialog → "No template" + "Ekstra statusside"), create + publish reports on both pages, then verify series isolation on the pages, labels in ProjectInformation, the extra portfolio row after crawl, and that the timeline/Excel export behave per the plan.
