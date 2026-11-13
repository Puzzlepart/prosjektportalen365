# Template Package Catalog (Malpakkekatalog)

A SPFx **ListView Command Set** on the **Maloppsett** (Template Options) list that
opens a Fluent UI v9 master–detail drawer for browsing template packages from the
central **`prosjektportalen-hosting`** catalog. A portal administrator can:

- Browse, search, filter (type / category / status) and sort the catalog.
- View package details, content summary and version history (from `CHANGELOG.md`).
- **Mode A — "Kopier til min installasjon"** (`Importert`): download the `.pppkg`,
  unzip it, validate the manifest, provision the hub, store the project-level
  assets and write a Maloppsett item.
- **Mode B — "Tilgjengeliggjør som skymal"** (`Sentral`): provision the package's
  **hub dependencies** (site fields, content types + their hub-list bindings, hub
  configuration rows and — feature-flag gated — taxonomy) and register a Maloppsett
  item that points at the hosting repo. Project-level content (template, extensions,
  list content incl. folder structures) is pulled straight from the `.pppkg` at
  project-setup time.
- Update or remove already-imported / central templates. A central template is updated in
  place («Oppdater skymal til v…») and stays `Sentral`; copying it to the installation adds an
  `Importert` item beside it.

## How it is wired

| Concern | Where |
| --- | --- |
| Command entry / mount | `src/extensions/templatePackageCatalog/index.tsx` (`render` into a `document.body` placeholder) |
| UI (Fluent v9) | `src/components/TemplatePackageCatalog/` (drawer root + `CatalogToolbar`, `PackageList`, `PackageCard`, `PackageDetails`, `InstallProgress`) |
| Models | `src/models/` (`ICatalog`, `ICatalogPackage`, `IPackageManifest`, `TemplateOptionsItem`, enums, …) |
| Services | `src/services/` — `CatalogService` (catalog + changelog), `TemplateOptionsService` (read/cross-ref/write), `PackageInstaller` (Mode A), `featureFlags` |
| Visibility | Shown only on the Maloppsett list (`Lists/TemplateOptions` URL) for users with `ManageWeb` |
| Registration | `Templates/Portfolio/Objects/CustomActions.xml` (ClientSideComponentId `75f97492-…`) + `channels/*.json` (`TemplatePackageCatalog`) |
| New Maloppsett fields | `Templates/Portfolio/Objects/Lists/Maloppsett.xml` (`PpPkg*`) + `Resources.*.resx` |
| Hub web | `SPDataAdapter.portalDataService.web` |

## Configuration (CustomAction `ClientSideComponentProperties`)

```json
{
  "catalogUrl": "https://raw.githubusercontent.com/Puzzlepart/prosjektportalen-hosting/main/catalog.json",
  "userGuideUrl": "https://…",
  "featureFlagProvisioning": false,
  "telemetryUrl": ""
}
```

- `catalogUrl` — defaults to the hosting `main` `catalog.json`. Falls back to the
  committed `services/sampleCatalog.ts` fixture on CORS/network failure. With a
  catalog of the customer's own, no catalog events are sent (see *Telemetry*).
- `userGuideUrl` — target of the "Se brukerveiledning" footer link.
- `featureFlagProvisioning` — see below.
- `telemetryUrl` — ingestion endpoint for the catalog's events. Defaults to
  `https://assist.prosjektportalen.no/api/telemetry/catalog` when omitted; set to
  an **empty string** to stop the catalog's events for the installation. See
  *Telemetry* below.

## Feature flag — taxonomy provisioning

Hub provisioning (fields, content types, lists, files, …) runs for real via the
existing `sp-js-provisioning` `WebProvisioner.applyTemplate` flow (the same one the
project setup template dialog uses), applied to the **hub web**.

The **taxonomy / Term Store** step **runs by default**: `sp-js-provisioning` 1.3.12
ships a Term Store handler (registered in its `DefaultHandlerMap`), so a package's
bundled term sets are provisioned as part of `applyTemplate`. The same flag and the
`SPDataAdapter.hasTermStorePermission()` pre-check gate the taxonomy step of **both**
Mode A import and Mode B publish-as-skymal
(`PackageInstaller.provisionCloudTemplateHubDependencies`).

Opt out of the taxonomy step via either:

- `featureFlagProvisioning: false` on the CustomAction properties, or
- `sessionStorage.setItem('PP_DISABLE_TAXONOMY', '1')` for local testing.

When disabled, the import step shows "Hoppet over (feature flag av)" and publishing
as skymal reports a warning that taxonomy was skipped.

`sessionStorage.setItem('PP_DISABLE_IMPORT', '1')` disables the whole import action
during a controlled pilot.

## Telemetry

To give Puzzlepart insight into which packages of the public catalog are installed
and used, the catalog sends one fire-and-forget event per completed (or failed)
catalog action — install, update, remove, publish-as-cloud-template — to the
`telemetryUrl` endpoint (prosjektportalen-assist by default, admin-login protected
storage).

Events are sent only when all of this holds (`services/TelemetryService.ts`, which
asks the gate every sender of usage statistics asks, `getTelemetryGate` in
`pp365-shared-library`):

- the hub's *Globale innstillinger* list has an enabled **`UsageStatisticsLevel`**
  row with the value `2` (Standard) or `3` (Utvidet);
- it has an enabled **`CatalogTelemetryEnabled`** row with exactly the value `1`
  (the template seeds it so);
- the catalog in use is the default one. A customer's own catalog (`catalogUrl`)
  names its packages itself, and those names stay in the tenant.

A missing or disabled row, a value that is not valid, a hub that cannot be read and
a level that is not read yet all send nothing: the gate fails closed. From 1.15.0 a
missing `CatalogTelemetryEnabled` row no longer counts as on.

Each event contains: action + success/error, package id/version/type, previously
registered version (updates, a cloud template's too, and removals), the installed
Prosjektportalen version, the tenant host (`*.sharepoint.com`), the hub site URL,
the AAD tenant id and the level (`2` or `3`). A failed action carries an error code
(such as `permission_denied` or `not_found`) at level `3` only. `detail` holds
nothing but `taxonomySkipped` (true or false) or `removedType` (the kind of
registration removed). No error message and no client timestamp is sent (both were,
in 1.14), and nothing about end users or project content. The request is sent
without cookies and without the page's address (`credentials: 'omit'`,
`referrerPolicy: 'no-referrer'`).

The events never block or fail a catalog action — failures are swallowed with an
Info log entry (`(TelemetryService)`).

Stop them via any of:

- the **`UsageStatisticsLevel`** row: `0` (off) or `1` (Grunnleggende) sends no
  catalog events;
- the **`CatalogTelemetryEnabled`** row: any value but `1` stops the catalog's
  events. The value `0` stops all of Prosjektportalen's browser telemetry, usage
  statistics included, whatever the level;
- `telemetryUrl: ""` on the CustomAction properties (the catalog's events, whole
  installation);
- `sessionStorage.setItem('PP_DISABLE_TELEMETRY', '1')` for the current tab, which
  stops all of Prosjektportalen's telemetry from it; or
- the browser's Global Privacy Control or Do Not Track.

A changed row applies within two hours: the hub's settings are cached for an hour,
and a decision is used for up to an hour.

## Dev / test

- **Hidden packages**: packages marked `hidden` in `catalog.json` are staged and
  never shown to users. To QA them, open the Maloppsett list with
  `?showHidden=true` in the URL (persisted as the `PP_SHOW_HIDDEN` session flag,
  so it survives SharePoint navigation; `?showHidden=false` turns it off, and it
  resets when the tab closes). Surfaced hidden packages carry a "Skjult" tag on
  the card and in the details pane.

- The default `catalogUrl` points at the hosting `main` branch's raw `catalog.json`,
  which is now published — so browsing works out of the box. The committed
  `sampleCatalog.ts` fixture mirrors it and is used as an offline fallback.
- Mode A downloads the `.pppkg` from the package's `downloadUrl` (a GitHub release,
  `dummy-prosjektmal-1.0.1.pppkg`); ensure that release is published, or build it with
  the hosting repo's `scripts/build-packages.js`. Its `hub-template.json` carries
  taxonomy, so it exercises the (feature-flag-gated) taxonomy path.

## Out of scope (other repos / later phases)

- Real `.pppkg` packaging + `catalog.json` publishing — `prosjektportalen-hosting`.
- The `sp-js-provisioning` taxonomy/Term Store handler — `sp-js-provisioning` fork.
- Runtime central-template resolution in the setup wizard + project-site stamping — Phase 3.
