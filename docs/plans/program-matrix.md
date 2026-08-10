# Parent/Program-level matrix — risk and opportunities aggregated from child projects

## Context

Parent projects and programs surface child-project uncertainties only as a *list* (`ProgramUncertainties.aspx`/`OverordnetUsikkerheter.aspx` hosting the ProgramAggregation web part). The abandoned `feat/parent-riskmatrix` branch (Aug 2024, commits `e7a2f365`, `6080d10d`, `2f9b1df8`) prototyped a matrix view by teaching the riskMatrix web part to fetch child risks via SharePoint search, but duplicated aggregation machinery into the web part class, only covered risks, and was never merged.

This feature ports that behavior, modernized: both the **riskMatrix** and **opportunityMatrix** web parts (ProjectWebParts) can aggregate uncertainty elements from child projects via search, with the aggregation primitives lifted into `pp365-shared-library` and shared with ProgramWebParts.

## Decisions

1. **Auto-detection** — new web part property `dataFetchMode: 'auto' | 'list' | 'dataSource'` (default `auto`): data source mode is used when the local `Prosjektegenskaper` flags `GtIsParentProject`/`GtIsProgram` are set and the hub is available, otherwise the local-list CAML path (byte-identical to before). Parent/program sites get aggregation with zero configuration; normal projects are untouched.
2. **Portfolio flag filter** — `filterByShowInPortfolio` toggle (default **on**): only items with `GtShowInPortfolioOWSBOOL === '1'` are shown in data source mode, so child projects control what bubbles up via the existing "Vis i porteføljen" field. Toggle off for parity with the aggregation list page.
3. **Default data sources resolved by GUID** — when the `dataSource` property is empty, the default is resolved via `GtDataSourceId` (risks `b0ef3852-230e-4119-8156-5a2ba625e5e1` "Alle risikoelementer for underområder", possibilities `dc3a4676-a38a-4fa7-a2b3-790f89046b52`), immune to install-language/user-locale mismatches; localized title lookup is the fallback. Both data sources ship OOTB at level "Overordnet/Program".
4. **One implementation of the aggregation machinery** — `buildAggregatedSiteIdQueries` (pure chunking, 2500 chars/25 sites) and `searchAggregatedItems` (search fan-out, RowLimit 500, TrimDuplicates false) now live in shared-library; ProgramWebParts' `SPDataAdapter.aggregatedQueryBuilder`/`_fetchItems` delegate to them with byte-identical output (the multirapportering KQL wildcard regex consumes the same strings). `PortfolioWebParts/src/models/ProgramItem.buildQueries` remains a known duplicate (different output format, single consumer) — tech debt for a follow-up.
5. **Apps-only deployment** — no `Templates/JsonTemplates/*.json` changes. A new **Prosjekttillegg** (`Templates/Content/Portfolio_content.no-NB/Prosjekttillegg/Usikkerhetsmatrise.json`) provisions a `Usikkerhetsmatrise.aspx` page with both matrices in forced `dataSource` mode. It can be uploaded directly to an existing hub's Prosjekttillegg library and applied via the setup wizard / "Kjør prosjektoppsett".

## Implementation

### shared-library

- **`src/util/buildAggregatedSiteIdQueries.ts`** — pure port of ProgramWebParts `aggregatedQueryBuilder`, parameterized on `siteIds` instead of class state.
- **`src/data/searchAggregatedItems.ts`** — port of ProgramWebParts `_fetchItems`: one `sp.search` per chunk (`Querytext: '*'`, always selecting `Path/Title/SiteTitle/SPWebURL`), `includeSelf` unshifts `SiteId:<selfSiteId>`, empty queries → `[]`.
- **`src/util/mapManagedPropertiesToInternalNames.ts`** — non-destructive normalizer adding internal-name keys (`GtRiskProbability`) alongside managed-property keys (`GtRiskProbabilityOWSNMBR`); explicit `fieldName → internalName` map (from data source columns **and refiners** — strategy/proximity/status are refiners) wins, `OWS(NMBR|CHCS|BOOL|TEXT|DATE|MTXT|MJSN|USER)` suffix strip is the fallback. Makes both the configurable field names and the default callout templates (`{GtRiskStrategy}` etc.) work unchanged for search items.
- **`DataSourceService.getById(dataSourceId)`** — GUID lookup on `GtDataSourceId`, sharing a private `_getSingle(filter)` with `getByName`.

### ProgramWebParts

- `SPDataAdapter.aggregatedQueryBuilder` and `_fetchItems` are now one-line delegates to the shared primitives. Signatures, output and all callers (`fetchDataForViewBatch`, `fetchItemsWithSource`, status-report wildcard hack) unchanged.

### ProjectWebParts

- **`data/SPDataAdapter`** (singleton, configured on every project page — all additions are lazy/memoized, zero cost for normal pages): `dataSourceService` (created in `configure` when the hub web is available), `getChildProjects()` (memoized `PortalDataService.getChildProjects`), `isParentProject()` (memoized local flags read, one request even with both matrices on a page; memos reset in `configure` for SPA navigation), `resolveDataSource(name, defaultId, defaultName)`, `fetchItemsFromDataSource(dataSource, selectProperties, includeSelf)`.
- **`webparts/baseUncertaintyMatrixWebPart`** — new abstract base hoisting the previously cloned `onInit`/`_getItems`/property pane from the two matrix web parts, parameterized by `{ contentTypeName, configurationFolder, defaultConfigurationSettingKey, defaultDataSourceId, defaultDataSourceName }`. Data source branch selects `ListItemID`, the `GtRisk*OWSCHCS` trio and `GtShowInPortfolioOWSBOOL` on top of the data source columns, filters on the portfolio flag, then normalizes. Also fixes the latent property-pane crash (`this._data.configurations` unguarded when `onInit` failed).
- **`webparts/riskMatrix` / `webparts/opportunityMatrix`** — shrunk to a `config` getter + `render()`; property/data interfaces preserved by name.
- **`models/UncertaintyElementModel`** — `id` widened to `number | string`; for search items (no `Id`/`ID`) the id is `<site title initials><ListItemID>` (e.g. `BY12`) to disambiguate equal list-item ids across sites; `siteTitle`/`webUrl`/`url` now assigned from `SiteTitle`/`SPWebURL`/`Path`, activating the pre-existing `"<siteTitle>: <title>"` tooltip.
- **`DynamicMatrix/MatrixElement`** — renders a Fluent `Badge` instead of `CounterBadge` (string ids render as pills; also fixes ids > 99 rendering as "99+").
- **Loc** — `DataFetchMode*`, `DataSource*`, `FilterByShowInPortfolioLabel` strings (nb + en); `DataSourceNotFound`/`DataSourceError` copied from ProgramWebParts.
- **Manifests** — preconfigure `dataFetchMode: "auto"` and `filterByShowInPortfolio: true` (runtime `?? 'auto'` / `?? true` covers existing instances).

## Edge cases

- Parent with zero children → only the self-site query runs → own flagged items or an empty matrix, no error.
- Hub unreachable → `auto` silently uses CAML; forced `dataSource` renders a localized error.
- Missing/renamed data source → localized `DataSourceNotFound` naming the source.
- Normal project in forced `dataSource` mode → searches its own site only; flagged items shown.
- ProjectStatus `UncertaintySection` is unaffected (single-arg model construction from CAML items; numeric ids render identically in the Badge).
- New parent site before property sync → flags absent → CAML; self-heals once synced.

## Verification (manual, against a real tenant)

1. Normal project: both matrices identical to before (CAML, no extra requests); property pane works, including after a failed `onInit`.
2. Parent/program site with children, `auto`: aggregated items with initials-prefixed badges, site-title tooltips, resolved callouts, working post-action toggle; portfolio-flag filter on/off; own items included.
3. Empty `dataSource` property resolves the GUID default (also with en-US user locale on an nb-NO install); bogus name → localized error.
4. > 25 children → chunked queries merged.
5. ProgramWebParts regression: program uncertainties/benefits/status pages unchanged.
6. Prosjekttillegg: upload `Usikkerhetsmatrise.json` to the hub library, apply via "Kjør prosjektoppsett" → page created; re-applying skips (create-or-skip handler).
