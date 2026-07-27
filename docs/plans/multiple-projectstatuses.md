# Multiple report series per project — "Multirapportering" via GtSiteId scope suffix

## Context

Today every project has one `Prosjektstatus.aspx` page hosting the ProjectStatus SPFx web part. All status reports for all projects live in a single hub-site list, **Prosjektstatus**, and a report is tied to its project through the text field `GtSiteId` (the project site GUID). Every consumer — the ProjectStatus web part, ProjectInformation, Portfolio overview (KQL), the StatusReportColumn (REST), Program web parts and the timeline — assumed **one report series per project** and resolved "the latest report" by taking the newest item for a given `GtSiteId`.

We want a project to be able to report status for multiple **sub-projects ("delprosjekter")** — one independent report series per sub-project, published per period per sub-project — from the **same** Prosjektstatus page, with a report scope selector choosing which sub-project you view and report for.

> An earlier iteration of this feature ("one report series per status page", with three new hidden fields `GtStatusPageId/Title/Url` and a Prosjekttillegg provisioning extra pages) was implemented and then replaced by this design. All of it has been reverted.

## Decisions

1. **One page + scope selector** — no extra status pages; the ProjectStatus web part gets a "delprosjekt" selector in the toolbar.
2. **Zero new SiteFields** — the scope is encoded as a **suffix on the existing `GtSiteId` value**:
   - Default series ("Hovedrapportering"): `GtSiteId = {siteId}` — exactly as before, which also covers all legacy reports.
   - Scoped series: `GtSiteId = {siteId}-{scopeKey}`, e.g. `d6905d0f-…-4e5f-DP1`.
   - **The base is always the project's existing site ID** — the suffix is appended to the same `props.siteId` the create flow always stamped; no new GUID is ever generated.
3. **Vocabulary + activation via web part properties** — property-pane group "Multirapportering" with a `multiReporting` toggle and a `subProjects` multiline list (`key` or `key|label` per line). The page also honors a `?scope=` URL query parameter for navigation/deep links.
4. **Portfolio behavior**: one row per report series — the default series keeps today's row; each scoped series adds a row labeled "{Prosjektnavn} – {scopeKey}" showing that series' latest published report in all status columns. Timeline budget/costs remain default-series-only (project-level facts).
5. Future option (not v1): read the vocabulary from project properties (Egenskaper) instead of the web part property.

## Core concept — suffix encoding

- Delimiter `-`; parsing is **positional** (a site GUID is always 36 chars, canonical 8-4-4-4-12), so the GUID's internal hyphens are unambiguous. `parseScopedSiteId(value)` returns `{ siteId, scopeKey }`; non-scoped/malformed/legacy zero-GUID values degrade to `{ value, '' }`.
- Scope keys are compared case-insensitively (`getScopeSeriesKey`); display casing is preserved. Key hygiene enforced by `parseSubProjects`: max 32 chars, no `'`, `|`, `?`, `&`, `#`, `%`, no leading `-`, case-insensitive dedupe. The **key is the identity** of the series — renaming a key starts a new series (the label is freely renameable).
- OData predicates: default series = `GtSiteId eq '{siteId}'` (byte-identical to before — no null/empty handling needed); scoped = `GtSiteId eq '{siteId}-{key}'`; all series = `startswith(GtSiteId,'{siteId}')` (a full GUID can never be a prefix of a different GUID).
- Search: KQL queries are `DepartmentId`/`ContentTypeId`-based and `GtSiteIdOWSTEXT` was already selected everywhere — **no new managed properties, no crawl dependency, no upgrade-order risk**.

## Implementation

### shared-library

- **`src/util/statusReportScope.ts`** (replaces `statusReportSeries.ts`): `parseScopedSiteId`, `getScopeSeriesKey`, `buildScopedSiteId`, `getScopeSeriesFilter`, `getAllScopesFilter`, `sortStatusReportsLatestFirst` (numeric `ListItemId` desc — kept correctness fix), `groupLatestReportBySeries(reports, siteIdProperty)` (map keyed on the parsed **base** siteId, so lookups with the pure GUID keep working; latest per `(siteId, scopeKey)`), `expandRowsPerStatusSeries(buildRow, series)` (base row + one row per scoped series with `Title = "{baseTitle} – {scopeKey}"`, `ScopeKey`, synthetic `key`).
- **`src/models/StatusReport.ts`**: `scopeKey` and `projectSiteId` getters (parsed from `GtSiteId`); `url()` appends `&scope={key}` for scoped reports.
- **`PortalDataService.getStatusReports`**: unchanged from its pre-feature shape — callers pass explicit filters built with the utils.

### ProjectStatus web part (ProjectWebParts)

- **Properties**: `multiReporting` (toggle) + `subProjects` (multiline `key|label`) in a new property-pane group; parsed/validated by `components/ProjectStatus/parseSubProjects.ts` (+ `getScopeLabel`).
- **Fetch** (`useProjectStatusDataFetch.ts`): one query fetches **all** series (`getAllScopesFilter`); scope resolution order: explicitly selected scope → `?selectedReport=`/hash match wins (the report's own scope, so deep links always land on the right series) → `?scope=` query param → default. `data.reports` is client-filtered to the resolved scope, so everything downstream (draft gating, carry-forward, report picker, publish/delete) is automatically scope-scoped. `data.scopeKeysWithReports` carries the distinct scope keys found in data.
- **State**: `state.selectedScope`; `SELECT_SCOPE` reducer action clears the selected report and bumps `refetch` (same contract as publish/delete/close-panel).
- **Scope selector** (`Commands/useScopeSelector.tsx`, modeled on `usePortfolioSelector`): first item "Hovedrapportering", then the union of the configured vocabulary and scope keys found in reports (so series whose key was removed/renamed stay reachable). Placed first among the toolbar's far items. Hidden unless `multiReporting` is on **or** scoped reports exist (turning the toggle off never hides existing series).
- **Create flow** (`useCreateNewStatusReport.ts`): `GtSiteId = buildScopedSiteId(props.siteId, state.selectedScope)`; report `Title` = "Ny statusrapport for {webTitle} – {scopeLabel}" when scoped. `GtSiteId` is pre-set before the carry-forward reduce (never overwritten) and hidden from all forms, so the panel cannot alter it. Carry-forward comes from the scoped report list.
- **Header**: appends " – {scopeLabel}" when a scope is selected.

### ProjectInformation + StatusReportColumn

- `fetchProjectStatusReportData.ts`: filter = `startswith(GtSiteId,'{siteId}') and GtModerationStatus eq 'Published'` — all series' published reports.
- `useProjectStatusReport.ts`: renders one `Header` + `SummarySection` block per series (latest published per scope key, default series first; scoped series labeled with the scope key — labels live in the ProjectStatus web part's properties which this widget cannot read, documented v1 limitation).
- `StatusReportColumn`: `ProjectStatusModel` parses `siteId`/`scopeKey` from the raw `GtSiteId`; the column matches rows on `(SiteId, ScopeKey)` case-insensitively.

### Portfolio/Program adapters

- Matching rule: project/site items always carry the **pure** GUID — only report items are suffixed. All project/site `.find` comparisons stay exact; only status-report grouping parses the base.
- Regular/manager/batch views expand one row per series via the shared util (`ScopeKey` + synthetic `key` on extra rows); merged multi-portfolio dedup key includes `ScopeKey`; timeline budget/costs filter to the default series (`!parseScopedSiteId(...).scopeKey`) to avoid double counting.
- Program status reports are sorted by `ListItemId` (kept fix — search `LastModifiedTime` order let an edited old report outrank a newer one).

## Key risks / edge cases

1. **KQL prefix-match in ProgramWebParts** — `aggregatedQueryBuilder` emits `GtSiteIdOWSTEXT:{guid}` terms consumed by the program report query. With `-` word-breaking these should prefix-phrase-match suffixed values, but **verify in tenant**; fallback = trailing wildcard (`{guid}*`) or client-side filtering.
2. **Renamed scope key = new series** — documented in the property-pane description; the union-based selector keeps old series reachable.
3. `?scope=` with an unknown key shows an empty series (deliberate); `?selectedReport=` overrides/repairs the scope.
4. **Per-scope drafts** — the "one unpublished draft" gate is now per series (each delprosjekt can hold its own draft). Intended behavior change.
5. PortfolioAggregation status-report data sources list scoped reports as items (they are real reports) — verify one such view.
6. Test tenants that ran the abandoned page-based iteration keep orphaned `GtStatusPage*` columns (template re-apply never deletes fields) — harmless; optional manual cleanup.

## Verification (manual — no test runner in the repo)

1. **Regression (zero scopes)**: default page (list/create/publish/delete/carry-forward — the fetch changed from `eq` to `startswith`, which returns identical rows when no suffixed items exist), ProjectInformation, Portfolio regular/manager/merged views, StatusReportColumn, program overview, timeline. Selector hidden.
2. **Feature (2 scopes)**: enable Multirapportering with `DP1|…`/`DP2|…`; create + publish in all three series; hub items carry `{guid}-DP1` where **the first 36 chars are byte-identical to the `GtSiteId` on the project's legacy reports**; per-scope isolation and independent drafts; Title/header labels; deep links `?scope=DP1` and bare `?selectedReport=`; ProjectInformation one block per series; portfolio rows "{Prosjektnavn} – DP1/DP2" after crawl; timeline unchanged; **program views show scoped rows (KQL check, risk 1)**.
3. **Edge**: remove `DP1` from the vocabulary → still selectable from data; unknown `?scope=X` → empty series; toggle off with scoped data → selector still visible.

---

## Implementation summary

All parts are implemented on `feat/multiple-projectstatuses` (replacing the earlier page-based commits).

### Reverted (page-based model)

- Templates: `GtStatusPage{Id,Title,Url}.xml` site fields, their `@.xml` includes, content-type/list FieldRefs, view fields, 6 resx keys × 2 languages, the `EkstraStatusside.json` Prosjekttillegg and its content-XML registration. Resources regenerated.
- Code: `useSeparateReportSeries`/`IStatusPageInfo`/page-identity derivation (ProjectStatus), `statusPageId` option + upgrade-retry (`PortalDataService`), `GtStatusPage*` exclusions (create flow, `StatusReportColumn` sections, `StatusReport.statusValues`), `statusPage*` model getters.

### Added / adapted

- `shared-library/src/util/statusReportScope.ts` (new; replaces `statusReportSeries.ts`) + `StatusReport.scopeKey`/`projectSiteId` + scope-aware `url()`.
- ProjectStatus: `multiReporting`/`subProjects` properties + property-pane group, `parseSubProjects.ts`, all-series fetch with scope resolution, `SELECT_SCOPE` reducer action, `useScopeSelector` toolbar item, scoped create flow (`buildScopedSiteId(props.siteId, scope)` — suffix on the existing site ID), scoped header title. New loc strings in `src/loc/*` (both languages).
- ProjectInformation: `startswith` fetch + per-series blocks keyed on `scopeKey`.
- PortfolioWebParts/ProgramWebParts: grouping/expansion re-keyed on parsed `GtSiteIdOWSTEXT` (call sites unchanged), `ScopeKey` row prop, merged-view dedup key with `ScopeKey`, timeline default-series filters with parsed base site ID, `GtStatusPage*OWSTEXT` selects removed (`ListItemId` sort kept).

### Verification notes

- Build order: shared-library before ProjectWebParts/PortfolioWebParts/ProgramWebParts.
- No new fields/managed properties ⇒ the feature works immediately after app deployment; the only crawl dependency is the pre-existing one (a new series' portfolio row appears after its first published report is crawled).
- The ProgramWebParts KQL prefix-match against suffixed `GtSiteIdOWSTEXT` values (risk 1) must be checked in a real tenant during the feature pass.
