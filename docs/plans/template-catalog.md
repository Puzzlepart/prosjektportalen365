# Malpakkekatalog – SPFx ListView Command Set + Fluent v9 Drawer

## Context

Prosjektportalen 365 is moving template management toward a **central template hosting** model (the active `feat/central-templates` branch). This PR builds the **Malpakkekatalog** ("template package catalog"): a new SPFx **ListView Command Set** on the **Maloppsett** list that opens a Fluent UI v9 master-detail `OverlayDrawer`. A portal admin can browse/search/filter packages from a `catalog.json`, view details (content summary + version history), and run two modes:

- **Mode A – "Kopier til min installasjon"** (`Importert`): download `.pppkg`, unzip, validate, provision, write a Maloppsett item.
- **Mode B – "Tilgjengeliggjør som skymal"** (`Sentral`): metadata-only Maloppsett item pointing at the hosting repo.

### Reality check vs. spec (drives several decisions)

Reading the repo surfaced gaps between the spec and what exists today:

- `sp-js-provisioning` is **v1.3.7/1.3.8** with API `new WebProvisioner(web).setup({ spfxContext, logging
}).applyTemplate(schema, handlers?, progressCb)` — there is no `provisionTemplate(hubContext, hubTemplate,
{ graphClient
})`, but the JSON-schema `WebProvisioner` **does** provision hub content (the installed handler set is **sitefields, contenttypes, lists, files, navigation, clientsidepages, customactions, features, composedlook, websettings, propertybagentries**). The **only** missing handler is **taxonomy/Term Store** (no handler in 1.3.7; `Schema` has no taxonomy key) — that, and any `@pnp/graph` need, is the out-of-repo piece. So Mode A reuses the **same JSON-schema provisioning mechanism the template dialog / ProjectSetup uses**, applied to the **hub web** (`portalDataService.web`). No `jszip` in `PortfolioExtensions` yet.
- The Maloppsett list is `Hidden=true`, both its title and URL are localized (`Template Options` / `Lists/TemplateOptions` en-US vs `Maloppsett` / `Lists/Maloppsett` nb-NO), and `GtProjectTemplate` is `Required="TRUE"`.

### Locked decisions (confirmed with user)

1. **Base branch:** `feat/central-templates`.
2. **Mode A = real hub provisioning, taxonomy gated:** build the full pipeline (download → unzip → manifest validation → `minPPVersion` → provision → Maloppsett write). Provisioning **reuses the existing `WebProvisioner.applyTemplate` JSON-schema flow** (the same mechanism the template dialog / ProjectSetup uses), applied to the **hub web** (`portalDataService.web`) with the unzipped `hub-template.json`. Only the **taxonomy/Term Store step is feature-flag-gated** (no handler in `sp-js-provisioning` 1.3.7 — it's the out-of-repo dependency), shown as "Hoppet over (feature flag av)". An optional global pilot switch can gate the whole import action during rollout. Real `.pppkg` packaging + `catalog.json` publishing remain out of scope (hosting repo).
3. **Catalog = real hosting contract:** `CatalogService` reads a configurable `catalogUrl`. The real `catalog.json`, JSON schemas, build script and a dummy test package now exist on the **`prosjektportalen-hosting` `dev` branch** (see *Hosting contract* below) — use those as the dev source/fixtures instead of inventing them. 24h cache invalidated by the catalog's `lastUpdated`. The catalog deliberately does **not** carry `contentSummary`/`downloads`/`recommended`/`category` — derive category from `tags`, content summary from the downloaded manifest, version history from `changelogUrl`; omit popularity/recommended in v1.
4. **Mode B lookup:** point `Sentral` items at a **sentinel `GtProjectTemplate` (id 1)** to satisfy `Required=TRUE`; distinguish by `PpPkgType=Sentral`. No schema change.
5. **Entry point:** ListView Command Set on Maloppsett (per spec); gate visibility by **list URL** + admin **site-group** membership.

---

## Hosting contract (`prosjektportalen-hosting` @ `dev`)

A dev has published the real contract + test assets on `origin/dev` (not yet on `main`). Treat these as the source of truth for the data model and as dev fixtures:

- **`catalog.json`** — root `{ $schema?, lastUpdated: ISO-8601, packages: []
}`. Package: required `id` (kebab), `name`, `version` (semver), `type` (`template|extension|content`), `author`, `downloadUrl`; optional `description`, `tags[]`, `thumbnail` (raw URL), `minPPVersion`, `publishedDate` (YYYY-MM-DD), `changelogUrl` (raw URL). `downloadUrl` is a GitHub **release asset** (`.../releases/download/v{ver
}/{pkg
}-{ver
}.pppkg`). The build script sorts packages by `name`.
- **`schema/catalog.schema.json`** + **`schema/pppkg-manifest.schema.json`** — draft-07 schemas to type our models against and validate.
- **`packages/dummy-prosjektmal/`** — a real test package: `manifest.json`, `provisioning/hub-template.json` (**contains taxonomy** — real term-set GUIDs), `provisioning/template.json`, `provisioning/extensions/*.json`, `content/*.json`, `assets/*`, `CHANGELOG.md` (Keep-a-Changelog `## [x.y.z] - dd/mm/yyyy`), `thumbnail.png`.
- **`scripts/build-packages.js`** — `.pppkg` is a **ZIP** (`archiver`, files at archive root) named `{pkg}-{version}.pppkg`; it also regenerates `catalog.json`. **`scripts/validate-manifest.js`** is the canonical manifest validator to mirror.
- **manifest.json** — `{ id, name, description?, version, author, license?, minPPVersion?, thumbnail?, tags?, type, provisioning?: { hubTemplate, template, extensions[] }, content?: { items[] }, changelog? }`. `provisioning.hubTemplate`/`template` are `provisioning/*.json` **sp-js-provisioning `Schema`** files; `content.items[]` = `{ id, name, description?, sourceFile, targetList, optional?, defaultSelected? }`.

**For dev/test:** point `catalogUrl` at the hosting raw `catalog.json` (or commit a copy as the fixture), and build the dummy `.pppkg` via the hosting repo's build script (or use its GitHub release) to exercise Mode A end-to-end.

---

## Architecture & conventions

- **Package:** `SharePointFramework/PortfolioExtensions` (`pp365-portfolioextensions`).
- **Folder:** `src/extensions/templatePackageCatalog/`.
- **File convention (repo-standard, NOT the spec's `*CommandSet.ts`):** entry is `index.tsx` + `manifest.json`, matching every existing extension. Bundle entrypoint → `./lib/extensions/templatePackageCatalog/index.js`.
- **Strings:** default import `import strings from 'PortfolioExtensionsStrings'`; shared list tokens via `import resource from 'SharedResources'`.
- **Theme/UI:** `import { customLightTheme, getFluentIcon, UserMessage } from 'pp365-shared-library'`; wrap tree in `<IdPrefixProvider value={useId(...)}><FluentProvider theme={customLightTheme}>` — exactly like [ProvisionDrawer.tsx](SharePointFramework/PortfolioWebParts/src/components/ProjectProvision/ProvisionDrawer/ProvisionDrawer.tsx).
- **State:** Context + `useState` shallow-merge hook (mirror [useProjectProvisionState.ts](SharePointFramework/PortfolioWebParts/src/components/ProjectProvision/useProjectProvisionState.ts) + [context.ts](SharePointFramework/PortfolioWebParts/src/components/ProjectProvision/context.ts)). **No RTK.**
- **Styling:** `*.module.scss` using CSS-var tokens (`var(--colorNeutral*)`), responsive `@media` — mirror [ProvisionDrawer.module.scss](SharePointFramework/PortfolioWebParts/src/components/ProjectProvision/ProvisionDrawer/ProvisionDrawer.module.scss). `.scss.ts` typings are build-generated — do not hand-author.
- **Icons:** `getFluentIcon('Dismiss' | 'Checkmark' | ...)` from shared-library.

---

## Subsystem 1 — Extension shell, entry point, config, loc

**Mirror:** [templateSelector/index.tsx](SharePointFramework/ProjectExtensions/src/extensions/templateSelector/index.tsx) (React mount) + [ideaRegistration/index.tsx](SharePointFramework/PortfolioExtensions/src/extensions/ideaRegistration/index.tsx) (visibility + auth).

**Create:**
- `src/extensions/templatePackageCatalog/manifest.json` — `id` (new GUID), `alias` `TemplatePackageCatalog`, `extensionType` `ListViewCommandSet`, `manifestVersion` 2, `version` `1.13.1`, one item `OPEN_TEMPLATE_PACKAGE_CATALOG` (title default "Malpakkekatalog", **non-empty base64 PNG `iconImageUrl`** like ideaRegistration — the themeColor SVG is applied at runtime in `onInit`, the PNG is the pre-init fallback).
- `src/extensions/templatePackageCatalog/index.tsx` — `export default class TemplatePackageCatalogCommandSet extends BaseListViewCommandSet<ITemplatePackageCatalogCommandProperties>`.
  - `@override onInit`: subscribe Logger; `await SPDataAdapter.configure(this.context, { siteId, webUrl })`; `tryGetCommand`; set title + themeColor SVG icon; `command.visible = false`; resolve admin authorization via `isUserAuthorized(this._sp, <admin site-group>, this.context)`; subscribe `listViewStateChangedEvent`; precompute placeholder id via `getId('templatepackagecatalog')`.
  - **Visibility gate (`listViewStateChanged`/`onListViewUpdated`):** `command.visible = userAuthorized && pageContext.list.serverRelativeUrl.endsWith(resource.Lists_TemplateOptions_Url)` — URL-based (locale-stable), **not** title. *(Implementer: confirm `Lists_TemplateOptions_Url`/`_Title` exist in the SPFx `SharedResources` loc; if absent, add them or match against the list's runtime URL.)*
  - `@override onExecute`: `switch(event.itemId)` → mount React into a `document.body` placeholder via `render`/`unmountComponentAtNode` (mirror templateSelector `_getPlaceholder`/`_onOpen`/`_unmount`). Pass `context`, `catalogUrl`, `featureFlagProvisioning`, `onDismiss` (which unmounts).
- `src/extensions/templatePackageCatalog/types.ts` — `ITemplatePackageCatalogCommandProperties { catalogUrl?: string; featureFlagProvisioning?: boolean; userGuideUrl?: string }`.

**Modify:**
- [config/config.json](SharePointFramework/PortfolioExtensions/config/config.json) — add bundle `template-package-catalog-command-set` → `{ entrypoint: ./lib/extensions/templatePackageCatalog/index.js, manifest: ./src/extensions/templatePackageCatalog/manifest.json }`. `localizedResources` unchanged.
- [src/loc/myStrings.d.ts](SharePointFramework/PortfolioExtensions/src/loc/myStrings.d.ts), [en-us.js](SharePointFramework/PortfolioExtensions/src/loc/en-us.js), [nb-no.js](SharePointFramework/PortfolioExtensions/src/loc/nb-no.js) — add all UI keys (command title, drawer title, "NY" badge, toolbar labels, sort options, card badge labels `Installert`/`Oppdatering tilgjengelig`/`Sentral`/`Ny`, action buttons, install-step labels, error/degraded messages, brukerveiledning link, aria labels). nb-NO carries the canonical Norwegian copy. **Must pass `npm run validate-loc`.**

---

## Subsystem 2 — Fluent v9 UI components

All under `src/extensions/templatePackageCatalog/components/`. Each component folder gets `*.tsx` + `*.module.scss` + `index.ts`.

- **`TemplatePackageCatalog/`** — root: `IdPrefixProvider > FluentProvider > OverlayDrawer role='panel' position='end' open onOpenChange→onDismiss`. Custom **~1000px width** via a `.module.scss` class overriding `--fui-Drawer--size: min(1000px,100vw)` (Fluent `size` prop only supports small/medium/large/full). `DrawerHeader`/`DrawerHeaderTitle` with title + `<Badge appearance='filled' color='brand'>NY</Badge>` + Dismiss `ToolbarButton`. `DrawerBody`: `<CatalogToolbar/>` + master-detail grid (`grid-template-columns: 380px 1fr`, collapses to one column < 720px). `DrawerFooter`: brukerveiledning `Link`. Loading → `Spinner`/`Skeleton`; error → `<UserMessage intent='error'>`; degraded catalog → `<UserMessage intent='warning'>`. Contains `context.ts`, `useTemplatePackageCatalogState.ts`, `useTemplatePackageCatalog.ts` (logic hook — mirror [useProvisionDrawer.ts](SharePointFramework/PortfolioWebParts/src/components/ProjectProvision/ProvisionDrawer/useProvisionDrawer.ts)), `types.ts`, `index.ts`.
- **`CatalogToolbar/`** — `SearchBox` (debounced, matches name/description/tags) + 3 `Dropdown` (Type from `type`; **Kategori derived from `tags`**; Status = Lokal/Importert/Sentral/"Oppdatering tilgjengelig"; each with "Alle") + "Tøm filtre" + **aria-live result counter** (single owner) + sort `Dropdown` (**Navn / Nyeste (`publishedDate`)**; default Nyeste, fall back to Navn when no date). No popularity/"Mest populære" (catalog has no `downloads`).
- **`PackageList/`** — `role=list` of `PackageCard`; empty-state `UserMessage`; client pagination bound to `state.page`.
- **`PackageCard/`** — selectable Fluent `Card` (mirror [SiteType.tsx](SharePointFramework/PortfolioWebParts/src/components/ProjectProvision/ProvisionDrawer/SiteType/SiteType.tsx)): `CardPreview` thumbnail (fallback on error), `name`, status `Badge` (Installert/Oppdatering/Sentral), `TagGroup`/`Tag` from `tags`, footer meta (`v{version}` · `publishedDate` · `author`), `aria-selected`. No downloads/"Anbefalt" badge (not in catalog).
- **`PackageDetails/`** — `PackageDetails.tsx` (name, description, meta, tags, action buttons + **back-to-list button for the <720px collapsed layout** with focus management); `PackageContentSummary.tsx` (**"Innhold i malen" derived from the downloaded manifest's `content.items` + `provisioning.extensions`** — the catalog has no content summary; shown during/after download or via a lazy manifest fetch, otherwise hidden); `PackageHistory.tsx` (**fetch + parse `changelogUrl` CHANGELOG.md** — Keep-a-Changelog `## [x.y.z] - dd/mm/yyyy` headings — newest first; fall back to a "Se endringslogg" `Link` on fetch failure). Action buttons: primary "Kopier til min installasjon" (Mode A), secondary "Tilgjengeliggjør som skymal" (Mode B); becomes "Oppdater til v{x}" / "Fjern" based on cross-ref state.
- **`InstallProgress/`** — ordered Mode A steps (Last ned → Pakk ut → Valider manifest → Sjekk minPPVersion → Provisjonér hub → Lagre prosjektmal → Tillegg → Innhold → Oppdater Maloppsett) with per-step status icons + `ProgressBar` + current-step caption; the **taxonomy** step shows "Hoppet over (feature flag av)" when its flag is off; terminal success/error `UserMessage`.

a11y: OverlayDrawer provides focus trap + Esc natively; explicit aria-labels on SearchBox/Dropdowns; the result counter is the single `aria-live=polite` region; `PackageCard` keyboard-activatable.

---

## Subsystem 3 — Services, models, two modes

Under `src/extensions/templatePackageCatalog/`.

**Models (`models/`)** — typed against the real schemas: `ICatalog` (`$schema?`, `lastUpdated: string`, `packages: ICatalogPackage[]`), `ICatalogPackage` (`id, name, description?, version, type, author, tags?, thumbnail?, downloadUrl, minPPVersion?, publishedDate?, changelogUrl?` — **no** `contentSummary`/`downloads`/`recommended`/`category`), `IPackageManifest` (+ `provisioning`/`content` sub-interfaces, matching `pppkg-manifest.schema.json`), `IPackageContentItem` (manifest-derived content summary), `IChangelogEntry` (parsed from `CHANGELOG.md`), `IMaloppsettTemplate` (model class `constructor(item, web, sp?)` — mirror [TemplateItem.ts](SharePointFramework/ProjectExtensions/src/models/TemplateItem.ts) — surfacing `PpPkg*` fields incl. **`PpPkgSourceUrl` as `{ Url, Description }`**), `enums.ts` (**`PpPkgType` = `'Lokal'|'Importert'|'Sentral'`** literals matching the SP Choice values; `InstallStep`/`InstallStepStatus`/`IInstallProgress` — **single definition, UI imports from here**; `PackageBadge`), `index.ts`. *(Optionally generate/copy the two hosting JSON schemas for runtime validation.)*

**Services (`services/`):**
- `CatalogService.ts` — `window.fetch(catalogUrl)`; parse/validate to `ICatalog` (against `catalog.schema.json`); **24h cache** in `PnPClientStorage().local` keyed by hashed `catalogUrl`, **invalidated when `catalog.lastUpdated` changes** (reuse [cache.ts](SharePointFramework/shared-library/src/data/cache.ts)); typed CORS/network/parse errors; **fall back to committed `sample-catalog.json`** when `catalogUrl` empty / in DEBUG. CORS vs `raw.githubusercontent.com` is acceptable (hosting-spec).
- `sample-catalog.json` — a copy of the hosting repo's real `catalog.json` (kept schema-valid). *(Import via `require()` guarded by DEBUG, or confirm `resolveJsonModule` in tsconfig + webpack JSON handling.)*
- `MaloppsettService.ts` — **single cross-reference owner.** Reads items via `PortalDataService.getItems(resource.Lists_TemplateOptions_Title, IMaloppsettTemplate)`; create/update/delete via the existing `'PROJECT_TEMPLATE_CONFIGURATION'` list key helpers ([PortalDataService.ts](SharePointFramework/shared-library/src/services/PortalDataService/PortalDataService.ts)). Returns enriched cross-ref `Map<PpPkgId, { badge, installedVersion, updateAvailable }>` computed vs catalog (semver compare `PpPkgVersion` vs `latestVersion`), **coalescing empty `PpPkgType` → `Lokal`** and normalizing `PpPkgId` (trim/lowercase). The hook consumes this read-only.
- `PackageInstaller.ts` — **Mode A (real hub provisioning):** `fetch .pppkg` (GitHub release asset) → **lazy-import** jszip + unzip (files at archive root) → read/validate `manifest.json` against `pppkg-manifest.schema.json` (mirror the hosting `validate-manifest.js` checks) → read the schema files it references (`provisioning/hub-template.json`, `provisioning/template.json`) → `minPPVersion` check (allow-with-warning when unknown) → **provision the hub** via `new WebProvisioner(SPDataAdapter.portalDataService.web).setup({ spfxContext, logging }).applyTemplate(hubSchema, excludeHandlers, progressCb)` — **mirroring [ApplyTemplate/index.ts](SharePointFramework/ProjectExtensions/src/extensions/projectSetup/tasks/ApplyTemplate/index.ts)** (the same flow the template dialog uses); `sp-js-provisioning` imported **only inside this branch** to keep the entrypoint lean → **store the project `template.json` schema** in the Template Library / Project Templates so the setup wizard applies it later (do not provision a project site at import time — none exists) → handle manifest extensions/content → write Maloppsett item (`PpPkgType=Importert`). The **taxonomy/Term Store step is the only feature-flag-gated part** (no handler in 1.3.7): when off, emit "Hoppet over (feature flag av)" and exclude any taxonomy section from the schema before `applyTemplate`; when the out-of-repo handler ships, flip the flag. Optionally precede the taxonomy step with `SPDataAdapter.hasTermStorePermission()`. Emits `InstallStep` progress via callback. *(Consider extracting the WebProvisioner setup into a shared `pp365-shared-library` helper reused by both ProjectSetup and the catalog; otherwise replicate the ~10-line pattern.)* **Mode B:** metadata-only item (`PpPkgType=Sentral`, `PpPkgSourceUrl`, **sentinel `GtProjectTemplate=1`**), no download/provision. **Update** branches on existing `PpPkgType` (Sentral → only refresh version fields; Importert → re-run install). **Remove** = `deleteItemFromList` by item id (never destructive site provisioning).
- `featureFlags.ts` — **sole authority:** `enableTaxonomyProvisioning = DEBUG || sessionStorage['PP_ENABLE_TAXONOMY'] || props.featureFlagProvisioning` gates only the taxonomy step; optional `enableImport` global pilot switch for the whole import action. UI never re-reads the property.
- `index.ts` — barrel.

**Modify:** [src/data/SPDataAdapter.ts](SharePointFramework/PortfolioExtensions/src/data/SPDataAdapter.ts) — add `getInstalledPPVersion()` using a **raw query** (`sp.web.lists.getByTitle(resource.Lists_InstallationLog_Title).items.select('InstallVersion').orderBy('Id', false).top(1)()`, defensive semver parse, fallback `this.context.manifest.version`) and a `hasTermStorePermission()` helper (scaffold-grade; reuse `sp.termStore` / `currentUserHasPermissions`). **Do not** route the install-log read through `PortalDataService` (no such list key). **Modify** [package.json](SharePointFramework/PortfolioExtensions/package.json): `rush add -p jszip` (+ `@types/jszip`), `rush add -p sp-js-provisioning` (~1.3.8, match ProjectExtensions). **Defer `@pnp/graph`.**

---

## Subsystem 4 — Templates package (provisioning) — *NOT `[apps-only]`*

**Modify [Maloppsett.xml](Templates/Portfolio/Objects/Lists/Maloppsett.xml):** add 7 `<Field>` in `<pnp:Fields>` (fresh brace-form GUIDs, `{resource:...}` DisplayName tokens, `StaticName==Name`):
- `PpPkgType` — `Type="Choice"` `Format="Dropdown"`, **literal** `<Default>Lokal</Default>` + `<CHOICES>` `Lokal`/`Importert`/`Sentral` (Norwegian literals, **not** resource tokens — keeps stored values stable across locales for TS comparisons).
- `PpPkgId`, `PpPkgVersion`, `PpPkgLatestVersion` — `Type="Text"` `MaxLength="255"`.
- `PpPkgSourceUrl` — `Type="URL"` `Format="Hyperlink"`.
- `PpPkgInstalledDate`, `PpPkgUpdatedDate` — `Type="DateTime"`.

Add `<pnp:DataValue FieldName="PpPkgType">Lokal</pnp:DataValue>` to **all 5** seeded `<pnp:DataRow>` entries (KeyColumn=Title, UpdateBehavior=Overwrite). Optionally add `PpPkgType`/`PpPkgVersion` to the default `<View>` ViewFields. *(Pre-existing user-authored items won't get a backfill — `MaloppsettService` coalesces empty → `Lokal`.)*

**Modify [Resources.en-US.resx](Templates/Portfolio/Resources.en-US.resx) + [Resources.no-NB.resx](Templates/Portfolio/Resources.no-NB.resx):** add `Lists_TemplateOptions_Fields_PpPkg*_DisplayName` (+ `_Description`) tokens, **1:1 parity** between both files (validate-loc does NOT cover resx). *(Final Norwegian/English copy to be confirmed — e.g. `PpPkgType` → "Malpakketype" / "Template package type".)*

**Modify [CustomActions.xml](Templates/Portfolio/Objects/CustomActions.xml):** add one `<pnp:CustomAction>` under `<pnp:WebCustomActions>` mirroring the Idea entries — `Location="ClientSideExtension.ListViewCommandSet.CommandBar"`, `RegistrationId="100"`, `RegistrationType="List"`, `Rights=""`, new `Name` GUID, `ClientSideComponentId` = new manifest id, `ClientSideComponentProperties` carrying `catalogUrl`/`featureFlagProvisioning`. (List scoping + admin gating happen in TS, per repo convention — no `Rights` attribute.) [Lists/@.xml](Templates/Portfolio/Objects/Lists/@.xml) already includes Maloppsett — no change.

**Build:** `npm run generate-project-templates` + `validate-project-template`. **Verify** whether `channels/main.json` / `.current-channel-config.json` need the new `ClientSideComponentId` (and field GUIDs) in their replace map for multi-channel builds.

Add a short `README.md` in the extension folder documenting the provisioning feature flag, the sample-catalog fixture, and the out-of-scope `.pppkg`/taxonomy dependencies.

---

## Risks & out of scope

- **Highest risk — entry-point reachability:** Maloppsett is `Hidden=true`; the command only renders on a browsable list view. Admins reach this list to manage templates today, so it should be fine — **verify during testing** that the list view + command bar render for the admin audience.
- **Bundle size / v8+v9:** `PortfolioExtensions` ships both Fluent v8 and v9; lazy-import jszip and gate `sp-js-provisioning` to keep the entrypoint lean and avoid style bleed inside the `document.body` placeholder.
- **CORS / hub permissions:** external `catalogUrl`/`.pppkg` fetch may be blocked → degrade to sample catalog + typed error (raw.githubusercontent.com is acceptable per hosting-spec; otherwise use `SPHttpClient`/same-origin). Hub provisioning via `WebProvisioner` writes to the hub web, so the admin needs hub write access — pre-check and surface a clear error.
- **Taxonomy gap:** `sp-js-provisioning` 1.3.7 has no Term Store handler, so any taxonomy section in `hub-template.json` is excluded and the step is gated until the out-of-repo handler ships. Templates whose hub schema depends on term sets won't be fully provisioned until then — surface this in the install result.
- **`[apps-only]` trap:** this PR edits `Templates/*.xml` + `*.resx`, so commits touching those **must not** be tagged `[apps-only]` or the fields/CustomAction never deploy.
- **Out of scope:** real `.pppkg` packaging + `catalog.json` publishing (hosting repo), the `sp-js-provisioning` taxonomy handler, runtime central-template fetch in the setup wizard (Phase 3), project-site stamping.

---

## Verification

1. `npm run lint` and `npm run validate-loc` (IPortfolioExtensionsStrings) green; no hardcoded colors/spacing (tokens only).
2. User builds the package (`gulp bundle`/`package-solution`) — build is handled by the user.
3. Deploy templates (non-`[apps-only]`) so the 7 fields + CustomAction provision to the hub; confirm seeded templates show `PpPkgType=Lokal`.
4. On the Maloppsett list view: command appears only for authorized admins; opens the drawer.
5. Catalog loads from the hosting `catalog.json` (raw URL or committed copy); search + filter (Type / Kategori-from-tags / Status) + sort (Navn/Nyeste) + "Tøm filtre" work; counter + pagination update; cross-ref badges (`Importert`/`Sentral`/"Oppdatering tilgjengelig") correct vs Maloppsett items.
6. **Mode A:** download → unzip → validate manifest → `minPPVersion` → **hub provisioning runs** via `WebProvisioner.applyTemplate(hubSchema)` against the hub web (verify hub fields/content types/lists/files appear) → project template schema stored for the wizard → Maloppsett item written (`Importert`); progress + success/error UI correct. With the taxonomy flag **off**, the taxonomy step shows "Hoppet over"; with it **on**, the taxonomy section is included (validate once the out-of-repo handler ships). Test with the hosting **`dummy-prosjektmal`** package (build `dummy-prosjektmal-1.0.1.pppkg` via the hosting repo's build script, or use its GitHub release) — note its `hub-template.json` carries taxonomy, so it exercises the gated path.
7. **Mode B:** creates `Sentral` item with sentinel `GtProjectTemplate=1` + `PpPkgSourceUrl`; no download/provision.
8. Update + remove flows; responsive collapse < 720px (back-to-list + focus); Esc/focus-trap/keyboard a11y.

## Workflow

- Branch from `feat/central-templates`.
- `rush add -p jszip @types/jszip sp-js-provisioning` in `PortfolioExtensions`, then `rush update && rush build`.
- Semantic English commits, e.g. `feat(portfolioextensions): add template package catalog command set`, `feat(portfolioextensions): implement catalog services and import scaffold`, `feat(templates): add PpPkg* fields and catalog command action to Maloppsett` (the templates commit must **not** be `[apps-only]`).
- PR back to `feat/central-templates`; smoke-test `smoketest-portfolioextensions.yml`.
