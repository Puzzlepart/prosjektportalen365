# Plan: PnPjs 3.17.0 to 4.21.0 (Phase 2)

Scoped 2026-09-16, implemented 2026-09-21. Depends on Phase 1 (`spfx-1.23-heft-toolchain.md`).

**Status (2026-09-21): complete.** All six solutions build on PnPjs 4.21.0 and `sp-js-provisioning` 1.4.0 (published the same day): `rush rebuild` exit 0, 0 TypeScript errors, 0 lint errors, 107 Jest tests passing, no `pp365-*` externals, and the built bundles carry PnPjs 4.21.0 plus only the 2.5.0 nested in `@pnp/spfx-controls-react`. The lock file no longer contains any `@pnp/*@3.x` or `@pnp/nodejs`. Remaining work is verification in the test tenant (see Verification).

## Context

Phase 1 moved the repo to SPFx 1.23.2 on Heft and deliberately left PnPjs at 3.17.0. This phase moves it to 4.21.0, a breaking major: `add`/`update` no longer wrap results, `getAll()` is gone, and taxonomy left `@pnp/sp` entirely.

Everything below was derived by reading the packed v4 tarballs and this repository, then re-checking each conclusion adversarially. Of 29 first-pass conclusions, 22 were corrected; the corrected versions are what is written here. Several claims in the Phase 1 plan's "deferred" section turned out to be wrong and are superseded.

### Corrections to earlier assumptions

| Earlier belief | Verified reality |
|---|---|
| `presets/all` is removed in v4 | It still exists (`@pnp/sp@4.21.0/presets/all.d.ts`, 38 re-exports). Our 14 barrel imports are a bundle-size question, not a blocker. |
| `.data` affects ~3 sites | 27 result-shape sites (`.data`, `.file`, `.folder`, `.group`, `.node`, `.task`). |
| `getAll()` is 18 call sites | 18 calls **plus** 7 `import '@pnp/sp/items/get-all'` side-effect imports. That subpath does not exist in v4, so those are unresolved-module **build failures**, not silent no-ops. One further call used the generic form `getAll<T>()`, which the scoping regex missed. |
| Taxonomy "moved to `@pnp/graph`" | It became a *different product*. Graph's term store has no `localProperties`, which PP365's phase and document-type behaviour is built on, and `@pnp/graph@4.21.0` pins the **beta** endpoint. `ITermInfo`/`ITermSetInfo` do not exist in v4 at all. |
| `sp-js-provisioning` is a version blocker | It pins exactly our 3.17.0 and contributes zero duplication today. The real problem is that we hand it a live `IWeb` at five call sites, and a v3 `IWeb` is not assignable to a v4 `IWeb`. |
| Bundles carry one PnPjs | They already carry **three** (2.5.0 via `@pnp/spfx-controls-react`, 3.9.0 via `sp-entityportal-service`, 3.17.0 ours), proven by version markers co-occurring in the built bundles. |
| `IListEnsureResult` is unaffected | It still exists in v4 but is no longer re-exported from the `@pnp/sp/lists` barrel; import it from `@pnp/sp/lists/types`. Found by the compiler, not by scoping. |
| `@microsoft/microsoft-graph-types` follows `@pnp/graph` | ProjectExtensions pinned `~2.38.0` directly while `@pnp/graph@4.21.0` depends on `2.43.0`, so our Planner code and PnPjs typed the same objects from two copies. Aligned to `2.43.0`. |

## Scale

| Area | Entries | Mechanical | Careful | Redesign |
|---|---|---|---|---|
| Our source | 100 | 60 | 24 | 16 |
| Third-party packages | 20 | 16 | 4 | 0 |
| Taxonomy | 21 | 13 | 5 | 3 |
| Sequencing | 17 | 11 | 4 | 2 |

The verified 188-entry inventory drove the edits; each consumer solution was migrated from a per-solution brief generated from it.

## Decisions

### A. Taxonomy: port PnPjs v3's `@pnp/sp/taxonomy` into shared-library (decided, done)

Graph's `TermStore.Term` has **no `localProperties`**, in v1.0 or beta. `Templates/Taxonomy/Taxonomy.xml` provisions roughly seven `<pnp:LocalCustomProperties>` per term, and they drive `PhaseLetter`, `PhaseSubText` and `Archiveable` through `ProjectPhaseModel`, `DocumentTypeModel` and `TaxonomyTermModel`. Adopting Graph would mean either a silently broken phase wheel or migrating every customer's hand-edited term store. Tenant-admin `TermStore.Read.All` consent was the second reason to reject it.

Ported as a read-only client in `shared-library/src/taxonomy/` over `_api/v2.1/termstore`: same field names as v3, no new permission, follows `nextLink` paging (v3 never did), unit tested without the PnPjs runtime. Entry point is `getTermStore(sp.web)`; the v3 `sp.termStore` augmentation is deliberately not reproduced because it made call sites invisible to search.

### B. `sp-entityportal-service`: vendor it into shared-library (decided, done)

Bumping was impossible (2.3.0 is the only version, last published 2023-08-07) and forking was impossible (no repository URL; the tarball is the only source). Vendored to `shared-library/src/services/EntityPortalService/` with MIT attribution, ported to v4, operations unit tested. Behaviour change: `fetchEntity` and `updateEntityItem` throw when no entity matches the identity (the package silently read `undefined`); `getEntityItem` still returns `undefined`, so "create when missing" flows are unchanged.

### C. `sp-js-provisioning`: bump to PnPjs 4 as a minor release, 1.4.0 (decided, done)

Ported in its own repository: `@pnp/*` moved to `peerDependencies ^4.21.0` (plus devDependencies), `@pnp/nodejs` to devDependencies, handlers fixed for v4 shapes, 17 unit tests under `node:test`, CHANGELOG entry `1.4.0`. Published as 1.4.0 on 2026-09-21 and both importers (PortfolioExtensions, ProjectExtensions) bumped; the nested `@pnp/*@3.17.0` tree is gone from the lock file. The peer dependency makes the consumer's PnPjs the only copy, so `IWeb` becomes assignable again and the two sides share one `@pnp/logging`.

### D. Term label resolution: one fixed chain (decided 2026-09-21)

Before this phase the three term models and `SPDataAdapterBase.getTerms` each had their own fallback rule. Product decision: every label lookup tries the web's language first, then `nb-NO`, then `en-US`, then the term's first label. nb-NO is the preferred language and every provisioned term carries it; en-US is supported for tenants running an English instance. Implemented once in `getTermLabel` (`TERM_LABEL_FALLBACK_LANGUAGE_TAGS`), used by `ProjectPhaseModel`, `DocumentTypeModel`, `TaxonomyTermModel`, `CustomEditPanel` and `getTerms`.

### E. No shared-library dependency on `sp-js-provisioning` (decided, done)

shared-library only imported the `Schema` type. It now declares `ProvisioningSchema` locally (the top-level keys plus an index signature), so the published library no longer drags a PnPjs-major-coupled package along for a type. Structured members are typed `any` on purpose: a first version typed them `Record<string, any>`, which is not assignable to `sp-js-provisioning`'s `IComposedLook`/`ITaxonomy` (required members) and broke `applyTemplate(schema)` in ProjectExtensions.

## What changed

### shared-library

- `src/data/getAllItems.ts`: `getAllItems(items, pageSize = 2000)` replaces `items.getAll()`. Always sends `$top` (v4's iterator otherwise falls back to 100-item pages, multiplying request counts roughly twentyfold). Unit tested.
- `src/taxonomy/`: term store client (Decision A) and the label/property readers (Decision D).
- `src/services/EntityPortalService/`: vendored service (Decision B).
- `src/models/ProvisioningSchema.ts` (Decision E).
- Result shapes: `ensureUser`, `items.add`, `items.update`, `files.addUsingPath`, `folders.addUsingPath` unwrapped in `SPDataAdapterBase`, `PortalDataService`, `CustomEditPanel/useModel`, `ListLogger`. `IItemUpdateResultData` is declared locally in `PortalDataService.ts` (v4 dropped the export); `IListEnsureResult` is imported from `@pnp/sp/lists/types`.
- Barrels export `getAllItems`, the taxonomy module and the entity service from the package root.

### Consumers

| Solution | Sites | Result |
|---|---|---|
| PortfolioWebParts | 5 `getAll` in `DataAdapter.ts` | clean build |
| ProgramWebParts | 4 `getAll` in `SPDataAdapter.ts` (one generic `getAll<T>()` missed by scoping) | clean build |
| PortfolioExtensions | result shapes in `ideaProjectData`, `PackageInstaller`; term store probe and `CompatibilityService` on `getTermStore` (the `any` casts are gone) | clean build |
| ProjectWebParts | 7 `getAll` (two `const [x]` sites became `.top(1)()`), `TaxonomyTermModel` and `fetchListData` on the ported taxonomy, `stampSiteIdFieldsOnFile` takes the web plus `IFileInfo` and re-resolves the item | clean build |
| ProjectExtensions | `getAll` x4, entity service imports, `PreTask` term set validation on `getTermStore` wrapped in `BaseTaskError`, `TemplateItem`/`DocumentTemplateDialog` on `IFileInfo` (new handles anchored on the target folder's web, not the hub web), `SitePermissions` via `siteGroups.getById(info.Id)`, quick launch children via `getById(info.Id).children`, Planner `IAddable` payloads with the ETag read from the POST body | clean build |

## Verification

Phase 1 made Heft's Jest phase part of every build (`heft test` gates `npm run build`), so this phase is the first with automated coverage:

| Layer | Coverage |
|---|---|
| `getAllItems` paging, term store paths/paging/labels/local properties, entity operations | 107 Jest tests in shared-library, run on every build |
| `sp-js-provisioning` handlers (lists, navigation, custom actions, web provisioner, package metadata) | 17 `node:test` tests (`npm test` in that repo) |
| Result-shape edits, taxonomy calls, `IWeb` boundary | type-checked against the v4 typings by `heft build` in each solution |

Behaviour changes a tester should know about, all deliberate:

- `SpEntityPortalService.getEntityItem` throws when the identity is empty (a project web without a Microsoft 365 group), where the old package created a hub row with an empty `GtGroupId`. Project setup now fails with `SetupProjectInformationErrorMessage` on such a web.
- `PreTask` term set validation raises a `BaseTaskError` (with `TermSetDoesNotExistError` on a 404) instead of letting a raw `HttpRequestError` escape the task.
- Every term label follows Decision D. `TaxonomyTermModel.properties` returns an empty object instead of throwing for a term with no properties in the set. Term enumeration follows server paging, where v3 returned only the first page.
- Planner: assignments are still applied by the follow-up PATCH; the ETag now comes from the POST payload with `'*'` as fallback.

Full `rush rebuild` on 2026-09-21 (5 min 53 s): 7 of 9 projects green (`pp365-eslint-config`, `pp365-spfx-tasks`, `pp365-templates`, `pp365-shared-library`, the three web part solutions), 0 lint errors, 107 Jest tests passed, and the only failures are the six boundary errors above in PortfolioExtensions and ProjectExtensions. Decision A from Phase 1 still holds after the dependency change: no `pp365-*` external in any AMD `define` header and exactly one manifest in `shared-library/dist`. The built web part bundles carry PnPjs 4.21.0 plus the 2.5.0 nested in `@pnp/spfx-controls-react`; no 3.x marker remains (Phase 1 bundles carried 2.5.0, 3.9.0 and 3.17.0 at once).

The unit tests exercise our logic against stand-ins; they do not execute SharePoint round trips. Until integration tests exist, one tenant run of the paths below is still the only execution-level check of the unwrapped result shapes and the paging:

| Path | Exercised by |
|---|---|
| `getAllItems` pagination | Portfolio overview and aggregated views on a list with more than 2000 items |
| Result shapes on add/update | Create an idea, publish a status report, upload a document from a template, add a column to a view |
| Provisioning (`sp-js-provisioning` boundary) | Run a full project setup after 1.4.0 is installed |
| Taxonomy | Phase wheel, document type filtering, term set validation in project setup, term store probe in the template catalog |
| Term labels (Decision D) | Phase names on an nb-NO web and on an en-US web |

## Finishing steps (done 2026-09-21)

1. `sp-js-provisioning` 1.4.0 published from its own repository.
2. `node docs/plans/pnpjs-4-migration-bump.js --provisioning-version=1.4.0` and `rush update` applied; the bump script can be deleted once this branch is merged.
3. `rush rebuild`: 9 of 9 projects green, no boundary errors left.
4. Still open: the tenant smoke run per the table above. CI now runs on `ubuntu-latest` with an 8 GB Node heap (see `spfx-1.23-heft-toolchain/HANDOFF.md`, "CI runner").

## Prerequisite

Commit Phase 1 separately from Phase 2. Both touch the same data adapters, and a combined diff would be very hard to review or bisect.
